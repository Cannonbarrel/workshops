"""
build.py — Run this once before terraform apply.

Works on Windows, Mac, and Linux.
Requires Python 3 (no extra tools needed).

Usage:
    python build.py
"""

import os
import shutil
import subprocess
import sys
import zipfile

BACKEND_DIR = os.path.join(os.path.dirname(__file__), "backend")
BUILD_DIR   = os.path.join(os.path.dirname(__file__), "backend", "_build")
ZIP_PATH    = os.path.join(BACKEND_DIR, "lambda.zip")


def run(cmd):
    print(f"  > {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr)
        sys.exit(1)


def build():
    print("\n=== Step 1: Clean build folder ===")
    if os.path.exists(BUILD_DIR):
        shutil.rmtree(BUILD_DIR)
    os.makedirs(BUILD_DIR)

    print("\n=== Step 2: Install Python dependencies ===")
    requirements = os.path.join(BACKEND_DIR, "requirements.txt")
    run([sys.executable, "-m", "pip", "install", "-r", requirements, "-t", BUILD_DIR, "-q"])

    print("\n=== Step 3: Copy Lambda function ===")
    shutil.copy(os.path.join(BACKEND_DIR, "lambda_function.py"), BUILD_DIR)

    print("\n=== Step 4: Create lambda.zip ===")
    if os.path.exists(ZIP_PATH):
        os.remove(ZIP_PATH)

    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(BUILD_DIR):
            # Skip __pycache__ folders
            dirs[:] = [d for d in dirs if d != "__pycache__"]
            for file in files:
                if file.endswith(".pyc"):
                    continue
                full_path = os.path.join(root, file)
                archive_name = os.path.relpath(full_path, BUILD_DIR)
                zf.write(full_path, archive_name)

    size_kb = os.path.getsize(ZIP_PATH) // 1024
    print(f"\nDone! lambda.zip created ({size_kb} KB)")
    print(f"Location: {ZIP_PATH}")
    print("\nYou can now run: terraform apply")


if __name__ == "__main__":
    build()
