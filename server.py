#!/usr/bin/env python3
import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

# Port ayarla
PORT = 8000

# Mevcut dizini kontrol et
current_dir = Path.cwd()
print(f"Sunucu başlatılıyor: {current_dir}")
print(f"Excel dosyası: {current_dir}/islamvy_99gun_strateji.xlsx")

# Özel istek handler
class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # CORS header'ları ekle
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_GET(self):
        # Ana sayfa isteği için index.html'i serv et
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

# Sunucuyu başlat
with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"Sunucu http://localhost:{PORT} adresinde çalışıyor")
    print("Tarayıcıda açılıyor...")
    
    # Tarayıcıyı otomatik aç
    webbrowser.open(f'http://localhost:{PORT}')
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nSunucu durduruluyor...")
        httpd.shutdown()
