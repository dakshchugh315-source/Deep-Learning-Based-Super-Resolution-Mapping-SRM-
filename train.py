import torch
from torch.utils.data import DataLoader
from dataset import SRDataset
from model import Sen2SRInspired

device = "cuda" if torch.cuda.is_available() else "cpu"
print("Using device:", device)

ds = SRDataset("train_lr/train_lr", "train_hr_all")
print("Total training pairs:", len(ds))

dl = DataLoader(ds, batch_size=4, shuffle=True, num_workers=0)  # batch size 4 rakha, model bada hai ab

model = Sen2SRInspired(scale=3).to(device)
opt = torch.optim.Adam(model.parameters(), lr=1e-4)
loss_fn = torch.nn.L1Loss()  # SR models me L1 loss zyada sharp results deta hai MSE se

epochs = 10
for epoch in range(epochs):
    total_loss = 0
    for batch_idx, (lr_img, hr_img) in enumerate(dl):
        lr_img, hr_img = lr_img.to(device), hr_img.to(device)
        out = model(lr_img)
        loss = loss_fn(out, hr_img)
        opt.zero_grad()
        loss.backward()
        opt.step()
        total_loss += loss.item()
        if batch_idx % 50 == 0:
            print(f"  Epoch {epoch+1} | Batch {batch_idx}/{len(dl)} | Loss: {loss.item():.6f}")
    print(f"Epoch {epoch+1}/{epochs}  avg loss: {total_loss/len(dl):.6f}")
torch.save(model.state_dict(), "model.pth")
print("Model saved as model.pth")