#!/usr/bin/env python3
"""
API simples para sincronizar dados do localStorage com data.json
Executa como um servidor HTTP que recebe POST com os dados e salva em data.json
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
from pathlib import Path
from datetime import datetime

class DataSyncHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Recebe dados via POST e salva em data.json"""
        if self.path == '/api/sync-data':
            # Ler o corpo da requisição
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            
            try:
                # Parse JSON
                data = json.loads(body)
                
                # Definir caminho do data.json
                data_file = Path(__file__).parent / 'data.json'
                
                # Fazer backup do arquivo anterior
                if data_file.exists():
                    backup_file = Path(__file__).parent / f'data.backup.{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
                    data_file.rename(backup_file)
                    print(f"[SYNC] Backup criado: {backup_file}")
                
                # Salvar os dados
                with open(data_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                
                print(f"[SYNC] Dados sincronizados com sucesso em {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                
                # Responder com sucesso
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {'success': True, 'message': 'Dados sincronizados com sucesso'}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                
            except json.JSONDecodeError as e:
                print(f"[ERROR] JSON inválido: {e}")
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {'success': False, 'message': f'JSON inválido: {str(e)}'}
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                print(f"[ERROR] Erro ao salvar dados: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {'success': False, 'message': f'Erro ao salvar: {str(e)}'}
                self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        """Responder a requisições OPTIONS para CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """Customizar logs"""
        if 'GET' in args[0]:
            return  # Não logar GETs
        print(f"[{self.client_address[0]}] {format % args}")

def run_server(port=8001):
    """Iniciar o servidor na porta 8001"""
    server_address = ('localhost', port)
    httpd = HTTPServer(server_address, DataSyncHandler)
    print(f"[SYNC SERVER] Iniciado na porta {port}")
    print(f"[SYNC SERVER] POST /api/sync-data para sincronizar dados")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[SYNC SERVER] Encerrado")
        httpd.shutdown()

if __name__ == '__main__':
    run_server()
