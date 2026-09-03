"""
Run the trained super-resolution model on ANY image you provide yourself
(no ground truth needed, no dataset needed).

Usage:
    python test_custom_image.py --image_path path/to/your/image.png
"""

import argparse
import numpy as np
import torch
from PIL import Image

from model import Sen2SRInspired


def main(args):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print("Using device:", device)

    # Load the trained model
    model = Sen2SRInspired(scale=3).to(device)
    model.load_state_dict(torch.load("model.pth", map_location=device))
    model.eval()

    # Load your custom image
    img = Image.open(args.image_path).convert("RGB")
    print("Input image size:", img.size)

    # The model was trained on 160x160 -> 480x480 (scale=3), so resize input to 160x160
    # If your image is a different size, this keeps things compatible with the trained model.
    input_size = args.input_size
    img_resized = img.resize((input_size, input_size), Image.BICUBIC)

    arr = np.array(img_resized, dtype=np.float32) / 255.0
    tensor = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).to(device)

    with torch.no_grad():
        output = model(tensor)[0]

    output_arr = output.detach().cpu().permute(1, 2, 0).numpy()
    output_arr = np.clip(output_arr, 0, 1)
    output_img = Image.fromarray((output_arr * 255).astype(np.uint8))

    # Also make a plain bicubic-upscaled version for comparison (no AI, just basic resize)
    bicubic_img = img_resized.resize((input_size * args.scale, input_size * args.scale), Image.BICUBIC)

    # Save side-by-side: original input | bicubic upscale (no AI) | model output (AI enhanced)
    w, h = output_img.size
    input_display = img_resized.resize((w, h))

    combined = Image.new("RGB", (w * 3 + 20, h))
    combined.paste(input_display, (0, 0))
    combined.paste(bicubic_img, (w + 10, 0))
    combined.paste(output_img, (w * 2 + 20, 0))

    combined.save("my_custom_result.png")
    output_img.save("my_custom_output_only.png")

    print("Saved: my_custom_result.png (left=input, middle=plain bicubic, right=your model's AI output)")
    print("Saved: my_custom_output_only.png (just the enhanced output, full size)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image_path", type=str, required=True, help="Path to your image file")
    parser.add_argument("--input_size", type=int, default=160, help="Size the model expects as input (default 160, matching training)")
    parser.add_argument("--scale", type=int, default=3, help="Upscale factor the model was trained with")
    args = parser.parse_args()
    main(args)