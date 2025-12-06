"""
Backend en Flask para cálculo de promedios y pronóstico de calificaciones,
con autenticación básica mediante sesión y validación de inscripción del usuario.

Estrategia básica de mantenimiento:
- Variable APP_VERSION para indicar la versión actual.
- Estructura APP_CHANGELOG para documentar cambios relevantes.
- Endpoint /meta para exponer información de versión y última actualización,
  útil para monitoreo y para coordinar despliegues y pruebas.
"""

import os
from typing import List, Optional
import math
from functools import wraps
from datetime import datetime

from flask import (
    Flask,
    request,
    jsonify,
    session,
    render_template
)
from werkzeug.security import generate_password_hash, check_password_hash

# 1. Configuración básica de la aplicación

# Ruta base del proyecto (carpeta donde está este app.py)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Indicamos explícitamente dónde están templates y estáticos:
# - Backend/templates  → HTML (index.html)
# - Backend/static     → CSS, JS, imágenes
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "Backend", "templates"),
    static_folder=os.path.join(BASE_DIR, "Backend", "static"),
)

# Clave secreta para firmar la sesión.
# En producción se recomienda definir SECRET_KEY en variables de entorno.
app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY",
    "llave_UNITEC_desarrollo"  # valor de respaldo solo para entorno local
)

# Metadatos de versión y mantenimiento
APP_VERSION = "1.0.0"
APP_LAST_UPDATE = "2025-12-02"
APP_CHANGELOG = [
    {
        "version": "1.0.0",
        "date": "2025-12-02",
        "changes": [
            "Implementación inicial de backend Flask.",
            "Autenticación básica con sesión y validación de usuario inscrito.",
            "Endpoint /calculate para cálculo de promedios y pronóstico.",
            "Integración con frontend (index.html, CSS, JS).",
            "Exposición del endpoint /meta para consulta de versión."
        ]
    }
]


# 2. "Base de datos" simulada de usuarios (en un entorno real iría a una BD)

usuarios = {
    "profesor_inscrito@ejemplo.com": {
        "password_hash": generate_password_hash("profe_inscrito"),
        "is_enrolled": True
    },
    "profesor_no_inscrito@ejemplo.com": {
        "password_hash": generate_password_hash("profe_no_inscrito"),
        "is_enrolled": False
    }
}


def obtener_usuario(email: str):
    """Devuelve el diccionario de usuario o None si no existe."""
    return usuarios.get(email)


# 3. Decorador para exigir autenticación e inscripción

def login_requerido(f):
    """
    Decorador que:
    - Verifica que haya un usuario autenticado en la sesión.
    - Verifica que esté marcado como inscrito (is_enrolled == True).

    Si no se cumple, devuelve un error JSON 401 o 403.
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        email = session.get("user_email")

        if not email:
            return jsonify({"error": "No autenticado. Inicia sesión primero."}), 401

        user = obtener_usuario(email)
        if not user:
            return jsonify({"error": "Usuario no encontrado."}), 401

        if not user.get("is_enrolled", False):
            return jsonify({
                "error": (
                    "Usuario no autorizado. Debe estar inscrito en la institución "
                    "para usar la aplicación."
                )
            }), 403

        return f(*args, **kwargs)

    return wrapper


# 4. Funciones de lógica (cálculos)

def calculate_average(grades: List[Optional[float]]) -> float:
    """
    Calcula el promedio usando solo las calificaciones válidas (no None, no NaN).
    Si no hay calificaciones válidas, devuelve NaN.
    """
    valid = [g for g in grades if g is not None and not math.isnan(g)]
    if not valid:
        return math.nan
    return sum(valid) / len(valid)


def forecast_last_two_average(grades: List[Optional[float]]) -> float:
    """
    Pronóstico simple basado en el promedio de las últimas dos calificaciones válidas.

    Reglas:
    - Si NO hay calificaciones válidas -> devuelve NaN.
    - Si solo hay UNA calificación válida -> el pronóstico es esa misma nota.
    - Si hay DOS o más calificaciones válidas -> se toman las 2 más recientes
      y se calcula su promedio.
    """
    valid = [g for g in grades if g is not None and not math.isnan(g)]
    n = len(valid)

    if n == 0:
        return math.nan
    if n == 1:
        return valid[0]

    last_two = valid[-2:]
    return sum(last_two) / len(last_two)


# 5. Rutas de frontend (HTML) y metadatos

@app.route("/")
def home():
    """
    Muestra la página principal con:
    - Formulario de login
    - Formulario de cálculo de promedios
    """
    return render_template(
        "index.html",
        app_version=APP_VERSION,
        last_update=APP_LAST_UPDATE
    )


@app.route("/health", methods=["GET"])
def health_check():
    """
    Endpoint sencillo para comprobar que el backend está en funcionamiento.
    Útil para monitoreo y pruebas de disponibilidad.
    """
    return jsonify({"status": "ok", "timestamp": datetime.utcnow().isoformat()}), 200


@app.route("/meta", methods=["GET"])
def meta_info():
    """
    Endpoint de mantenimiento y versionado.
    Devuelve información sobre:
    - Versión actual
    - Fecha de última actualización
    - Cambios relevantes (changelog resumido)
    """
    return jsonify({
        "app_version": APP_VERSION,
        "last_update": APP_LAST_UPDATE,
        "changelog": APP_CHANGELOG
    }), 200


# 6. Endpoints de autenticación con modelo de monetización implícito

@app.route("/login", methods=["POST"])
def login():
    """
    Endpoint de autenticación básica.
    Espera un JSON con, por ejemplo:
    {
      "email": "profesor_inscrito@ejemplo.com",
      "password": "profe_inscrito"
    }

    Si las credenciales son válidas y el usuario existe,
    se almacena el email en la sesión.
    """
    data = request.get_json(silent=True)

    if data is None:
        return jsonify({"error": "No se recibió un JSON válido"}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Se requieren 'email' y 'password'."}), 400

    user = obtener_usuario(email)
    if not user:
        return jsonify({"error": "Credenciales inválidas."}), 401

    if not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Credenciales inválidas."}), 401

    # Credenciales correctas: guardamos el usuario en la sesión
    session["user_email"] = email

    return jsonify({
        "message": "Inicio de sesión exitoso.",
        "email": email,
        "is_enrolled": user.get("is_enrolled", False)
    }), 200


@app.route("/logout", methods=["POST"])
def logout():
    """
    Endpoint para cerrar sesión.
    Elimina el usuario de la sesión actual.
    """
    session.pop("user_email", None)
    return jsonify({"message": "Sesión cerrada correctamente."}), 200


# 7. Endpoint de cálculo (requiere autenticación + inscripción)

@app.route("/calculate", methods=["POST"])
@login_requerido
def calculate_grades():
    """
    Endpoint principal:
    - Requiere que el usuario esté autenticado y esté inscrito.
    - Recibe un JSON con student_name y subjects.
    - Calcula promedio y pronóstico por materia.
    - Calcula promedio global (promedio de promedios por materia).
    - Devuelve un JSON con los resultados.
    """
    data = request.get_json(silent=True)

    if data is None:
        return jsonify({"error": "No se recibió un JSON válido"}), 400

    if "student_name" not in data or "subjects" not in data:
        return jsonify({"error": "Faltan campos requeridos: 'student_name' o 'subjects'"}), 400

    student_name = data.get("student_name")
    subjects_input = data.get("subjects", [])

    subjects_output = []
    averages = []

    for subj in subjects_input:
        name = subj.get("name")
        grades = subj.get("grades", [])

        cleaned_grades: List[Optional[float]] = []
        for g in grades:
            if g is None:
                cleaned_grades.append(None)
            else:
                try:
                    cleaned_grades.append(float(g))
                except (TypeError, ValueError):
                    cleaned_grades.append(None)

        avg = calculate_average(cleaned_grades)
        fc = forecast_last_two_average(cleaned_grades)

        if not math.isnan(avg):
            averages.append(avg)

        subjects_output.append({
            "name": name,
            "average": avg if not math.isnan(avg) else 0.0,
            "forecast": fc if not math.isnan(fc) else 0.0
        })

    global_average = sum(averages) / len(averages) if averages else 0.0

    response = {
        "student_name": student_name,
        "subjects": subjects_output,
        "global_average": global_average
    }

    return jsonify(response), 200


# 8. Punto de entrada para ejecución local

if __name__ == "__main__":
    # debug=True solo para desarrollo; en producción se debe desactivar
    app.run(host="0.0.0.0", port=5000, debug=True)
