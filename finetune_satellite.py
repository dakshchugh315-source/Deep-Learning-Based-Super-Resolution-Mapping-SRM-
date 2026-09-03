import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torch.cuda.amp import autocast, GradScaler
import cv2
import numpy as np
import os

# ==========================================
# 1. ARCHITECTURE (RRDBNet Backbone)
# ==========================================
class DenseBlock(nn.Module):
    def __init__(self, in_c, growth_c=32):
        super().__init__()
        self.conv1 = nn.Conv2d(in_c, growth_c, 3, 1, 1)
        self.conv2 = nn.Conv2d(in_c + growth_c, growth_c, 3, 1, 1)
        self.conv3 = nn.Conv2d(in_c + 2 * growth_c, growth_c, 3, 1, 1)
        self.conv4 = nn.Conv2d(in_c + 3 * growth_c, growth_c, 3, 1, 1)
        self.conv5 = nn.Conv2d(in_c + 4 * growth_c, in_c, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, True)

    def forward(self, x):
        x1 = self.lrelu(self.conv1(x))
        x2 = self.lrelu(self.conv2(torch.cat((x, x1), 1)))
        x3 = self.lrelu(self.conv3(torch.cat((x, x1, x2), 1)))
        x4 = self.lrelu(self.conv4(torch.cat((x, x1, x2, x3), 1)))
        return self.conv5(torch.cat((x, x1, x2, x3, x4), 1)) * 0.2 + x

class RRDB(nn.Module):
    def __init__(self, c):
        super().__init__()
        self.rdb1, self.rdb2, self.rdb3 = DenseBlock(c), DenseBlock(c), DenseBlock(c)
    def forward(self, x):
        return (self.rdb3(self.rdb2(self.rdb1(x))) * 0.2) + x

class ESRGAN_Backbone(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv_first = nn.Conv2d(3, 64, 3, 1, 1)
        self.body = nn.Sequential(*[RRDB(64) for _ in range(23)])
        self.conv_body = nn.Conv2d(64, 64, 3, 1, 1)
        # Yahan naam change kiye hain: upconv -> conv_up
        self.conv_up1 = nn.Conv2d(64, 64, 3, 1, 1)
        self.conv_up2 = nn.Conv2d(64, 64, 3, 1, 1)
        self.conv_hr = nn.Conv2d(64, 64, 3, 1, 1)
        self.conv_last = nn.Conv2d(64, 3, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, True)

    def forward(self, x):
        feat = self.conv_first(x)
        feat = feat + self.conv_body(self.body(feat))
        # Yahan bhi naye naam use kiye hain
        feat = self.lrelu(self.conv_up1(torch.nn.functional.interpolate(feat, scale_factor=2, mode='nearest')))
        feat = self.lrelu(self.conv_up2(torch.nn.functional.interpolate(feat, scale_factor=2, mode='nearest')))
        return self.conv_last(self.lrelu(self.conv_hr(feat)))
# ==========================================
# 2. PHYSICS-AWARE SATELLITE LOSS
# ==========================================
class SatelliteLoss(nn.Module):
    def __init__(self, sam_weight=0.5):
        super().__init__()
        self.l1 = nn.L1Loss()
        self.sam_weight = sam_weight

    def forward(self, pred, target):
        loss_pixel = self.l1(pred, target)
        
        # Spectral Angle Mapper (SAM) - Prevents color hallucination
        dot = torch.sum(pred * target, dim=1)
        norm_p = torch.norm(pred, dim=1) + 1e-7
        norm_t = torch.norm(target, dim=1) + 1e-7
        cos_theta = torch.clamp(dot / (norm_p * norm_t), -1.0, 1.0)
        loss_sam = torch.mean(torch.acos(cos_theta))
        
        return loss_pixel + (self.sam_weight * loss_sam)

# ==========================================
# 3. SELF-SUPERVISED DATASET
# ==========================================
class SatelliteDataset(Dataset):
    def __init__(self, img_path, patch_size=128, samples=1000):
        img = cv2.cvtColor(cv2.imread(img_path), cv2.COLOR_BGR2RGB)
        self.data = img.astype(np.float32) / 255.0
        self.patch_size = patch_size
        self.samples = samples
        self.h, self.w = self.data.shape[:2]

    def __len__(self): return self.samples

    def __getitem__(self, idx):
        y = np.random.randint(0, self.h - self.patch_size)
        x = np.random.randint(0, self.w - self.patch_size)
        hr = self.data[y:y+self.patch_size, x:x+self.patch_size]
        
        # Create Synthetic 10m LR from the HR patch
        lr_size = self.patch_size // 4
        lr = cv2.resize(hr, (lr_size, lr_size), interpolation=cv2.INTER_CUBIC)
        
        return torch.from_numpy(lr).permute(2,0,1), torch.from_numpy(hr).permute(2,0,1)

# ==========================================
# 4. FINE-TUNING LOOP
# ==========================================
def train():
    device = torch.device('cuda')
    print(f"🔥 Fine-tuning started on {torch.cuda.get_device_name(0)}")

    # Load Model & Inject Pre-trained Weights
    model = ESRGAN_Backbone().to(device)
    pretrained = torch.load('base_model.pth', map_location=device)['params_ema']
    model.load_state_dict(pretrained, strict=True)
    
    # Freeze the deep body blocks initially (Transfer Learning)
    for param in model.body.parameters():
        param.requires_grad = False

    dataset = SatelliteDataset('hr_image.jpg', samples=800)
    dataloader = DataLoader(dataset, batch_size=16, shuffle=True, num_workers=4)
    
    criterion = SatelliteLoss().to(device)
    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-4)
    scaler = GradScaler()
    
    epochs = 20
    for epoch in range(epochs):
        epoch_loss = 0
        model.train()
        for lr, hr in dataloader:
            lr, hr = lr.to(device), hr.to(device)
            optimizer.zero_grad()
            
            with autocast():
                sr = model(lr)
                loss = criterion(sr, hr)
                
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            epoch_loss += loss.item()
            
        print(f"Epoch [{epoch+1}/{epochs}] | Loss: {epoch_loss/len(dataloader):.4f}")
        
    torch.save(model.state_dict(), 'satellite_finetuned.pth')
    print("✅ Training Complete! Model saved as 'satellite_finetuned.pth'")

if __name__ == '__main__':
    train()