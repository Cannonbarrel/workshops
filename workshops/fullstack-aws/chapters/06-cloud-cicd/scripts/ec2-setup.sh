#!/bin/bash
set -e

echo "=== Installing nginx ==="
sudo apt-get update -y -q
sudo apt-get install -y -q nginx

echo "=== Creating Hello World page ==="
sudo tee /var/www/html/index.html > /dev/null <<'EOF'
<!DOCTYPE html>
<html>
  <head><title>Hello World</title></head>
  <body>
    <h1>Hello World from EC2!</h1>
    <p>Deployed via shell script.</p>
  </body>
</html>
EOF

echo "=== Starting nginx ==="
sudo systemctl enable nginx
sudo systemctl start nginx

echo ""
echo "=== Done! ==="
echo "Open http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4) in your browser"
