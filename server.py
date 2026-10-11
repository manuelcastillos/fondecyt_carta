#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Servidor local para la campaña de la Carta Fondecyt 2027.
Permite probar la web localmente y almacenar las firmas en una base de datos SQLite (firmas.db).
No requiere dependencias externas (usa solo la librería estándar de Python).
"""

import http.server
import socketserver
import sqlite3
import json
import urllib.parse
import os
import sys
import datetime
import csv
import io

PORT = 8000
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "firmas.db")
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS adherentes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT,
            nombre TEXT NOT NULL,
            institucion TEXT NOT NULL,
            correo TEXT,
            tipo TEXT,
            concurso TEXT,
            grupo TEXT,
            folio TEXT,
            comentario TEXT,
            es_publico INTEGER DEFAULT 1
        )
    ''')
    
    # Verificar si está vacía para insertar los firmantes iniciales del documento original
    c.execute('SELECT COUNT(*) FROM adherentes')
    count = c.fetchone()[0]
    if count == 0:
        firmantes_iniciales = [
            ("2026-10-09 10:00:00", "Manuel Castillo Silva", "Universidad de Valparaíso", "", "Investigador(a) Afectado(a)", "Regular 2027", "Ciencias de la Tierra", "", "Convocante. Postulación declarada fuera de bases por justificación en SPL.", 1),
            ("2026-10-09 10:05:00", "Angélica Escobar Maldonado", "Universidad de Valparaíso", "", "Investigador(a) Afectado(a)", "Regular 2027", "Biología 3", "1272708", "Postulación rechazada por justificación de pasajes en español.", 1),
            ("2026-10-09 10:10:00", "Daniel Ramírez Ruiz", "Universidad de Valparaíso", "", "Investigador(a) Afectado(a)", "Regular 2027", "Ingeniería 1", "1271540", "Formulación técnica 100% en inglés declarada fuera de bases.", 1),
            ("2026-10-09 10:15:00", "Jonathan Martínez Pinto", "Universidad de Valparaíso", "", "Investigador(a) Afectado(a)", "Regular 2027", "Inter-Trans Disciplinario", "1272745", "Exclusión arbitraria por plataforma que inducía al error.", 1),
            ("2026-10-09 10:20:00", "Evandro Ferrada Poblete", "Universidad de Valparaíso", "", "Investigador(a) Afectado(a)", "Regular 2027", "Biología 1", "1271725", "Formulación técnica 100% en inglés declarada fuera de bases.", 1)
        ]
        c.executemany('''
            INSERT INTO adherentes (fecha, nombre, institucion, correo, tipo, concurso, grupo, folio, comentario, es_publico)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', firmantes_iniciales)
        conn.commit()
        print(f"[BD] Inicializada base de datos con {len(firmantes_iniciales)} firmantes iniciales.")
    conn.close()

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        if path == "/api/adherentes":
            self.handle_get_adherentes()
        elif path == "/api/stats":
            self.handle_get_stats()
        elif path == "/api/export-csv":
            self.handle_export_csv()
        else:
            super().do_GET()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        if path == "/api/adherentes":
            self.handle_post_adherente()
        else:
            self.send_error(404, "Endpoint no encontrado")

    def handle_get_adherentes(self):
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT id, fecha, nombre, institucion, tipo, concurso, grupo, folio, comentario FROM adherentes ORDER BY id DESC')
        rows = [dict(r) for r in c.fetchall()]
        conn.close()

        response = {
            "status": "success",
            "total": len(rows),
            "data": rows
        }
        self.send_json_response(200, response)

    def handle_get_stats(self):
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        c.execute('SELECT COUNT(*) FROM adherentes')
        total = c.fetchone()[0]

        c.execute("SELECT COUNT(*) FROM adherentes WHERE tipo LIKE '%Afectado%'")
        afectados = c.fetchone()[0]

        c.execute("SELECT COUNT(DISTINCT LOWER(TRIM(institucion))) FROM adherentes WHERE institucion != ''")
        instituciones = c.fetchone()[0]

        c.execute("SELECT COUNT(DISTINCT grupo) FROM adherentes WHERE grupo != ''")
        grupos = c.fetchone()[0]

        # Conteo por concurso
        c.execute("SELECT concurso, COUNT(*) FROM adherentes GROUP BY concurso")
        por_concurso = dict(c.fetchall())

        conn.close()

        stats = {
            "total": total,
            "afectados": afectados,
            "instituciones": instituciones,
            "grupos": grupos,
            "por_concurso": por_concurso
        }
        self.send_json_response(200, stats)

    def handle_post_adherente(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"status": "error", "message": "JSON inválido"})
            return

        nombre = data.get("nombre", "").strip()
        institucion = data.get("institucion", "").strip()
        correo = data.get("correo", "").strip()
        tipo = data.get("tipo", "Investigador(a) Afectado(a)").strip()
        concurso = data.get("concurso", "Regular 2027").strip()
        grupo = data.get("grupo", "").strip()
        folio = data.get("folio", "").strip()
        comentario = data.get("comentario", "").strip()

        if not nombre or not institucion:
            self.send_json_response(400, {"status": "error", "message": "Nombre e Institución son obligatorios."})
            return

        ahora = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        # Evitar duplicados exactos recientes de nombre + institucion
        c.execute("SELECT id FROM adherentes WHERE LOWER(nombre) = LOWER(?) AND LOWER(institucion) = LOWER(?)", (nombre, institucion))
        existente = c.fetchone()
        if existente:
            conn.close()
            self.send_json_response(409, {"status": "warning", "message": "Ya existe una adhesión registrada con este nombre e institución."})
            return

        c.execute('''
            INSERT INTO adherentes (fecha, nombre, institucion, correo, tipo, concurso, grupo, folio, comentario, es_publico)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ''', (ahora, nombre, institucion, correo, tipo, concurso, grupo, folio, comentario))
        conn.commit()
        nuevo_id = c.lastrowid
        conn.close()

        self.send_json_response(201, {
            "status": "success",
            "message": "Adhesión registrada exitosamente. ¡Gracias por sumarte a la causa!",
            "id": nuevo_id
        })

    def handle_export_csv(self):
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('SELECT id, fecha, nombre, institucion, tipo, concurso, grupo, folio, comentario FROM adherentes ORDER BY id ASC')
        rows = c.fetchall()
        conn.close()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Fecha", "Nombre", "Institución", "Tipo", "Concurso", "Grupo de Evaluación", "Folio", "Comentario"])
        for r in rows:
            writer.writerow(r)

        csv_bytes = output.getvalue().encode('utf-8-sig') # UTF-8 con BOM para Excel en español

        self.send_response(200)
        self.send_header('Content-Type', 'text/csv; charset=utf-8')
        self.send_header('Content-Disposition', 'attachment; filename="adherentes_carta_fondecyt.csv"')
        self.send_header('Content-Length', str(len(csv_bytes)))
        self.end_headers()
        self.wfile.write(csv_bytes)

    def send_json_response(self, code, data):
        json_bytes = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-Length', str(len(json_bytes)))
        self.end_headers()
        self.wfile.write(json_bytes)

def run():
    init_db()
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"\n=======================================================")
        print(f"🚀 Servidor Carta Fondecyt 2027 en ejecución:")
        print(f"👉 http://localhost:{PORT}")
        print(f"👉 Presiona Ctrl+C para detener el servidor.")
        print(f"=======================================================\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")

if __name__ == "__main__":
    run()
