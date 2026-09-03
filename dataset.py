import os
import tifffile
import torch
from torch.utils.data import Dataset

class SRDataset(Dataset):
    def __init__(self, lr_dir, hr_dir):
        self.lr_dir = lr_dir
        self.hr_dir = hr_dir
        lr_files = set(os.listdir(lr_dir))
        hr_files = set(os.listdir(hr_dir))
        self.files = sorted(lr_files & hr_files)  # sirf matched pairs

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        fname = self.files[idx]
        lr = tifffile.imread(os.path.join(self.lr_dir, fname))  # (3,160,160)
        hr = tifffile.imread(os.path.join(self.hr_dir, fname))  # (3,480,480)
        lr_t = torch.from_numpy(lr).float()
        hr_t = torch.from_numpy(hr).float()
        return lr_t, hr_t