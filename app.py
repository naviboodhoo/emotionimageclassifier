from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import os
import logging

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app, resources={r"/predict": {"origins": "*"}})

# Configure logging
logging.basicConfig(level=logging.INFO)

# Load the model
try:
    model_path = os.path.join('models', 'happy_sad_model.h5')  # Adjust if model is in root
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at: {model_path}")
    model = load_model(model_path)
    logging.info("Model loaded successfully")
except Exception as e:
    logging.error(f"Failed to load model: {e}")
    model = None

# Preprocess image
def preprocess_image(file):
    try:
        img = Image.open(file).convert("RGB")
        img = img.resize((256, 256))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)  # (1, 256, 256, 3)
        return img_array
    except Exception as e:
        logging.error(f"Error preprocessing image: {e}")
        raise

# Prediction route
@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        if 'file' not in request.files:
            logging.warning("No file part in request")
            return jsonify({"error": "No file part"}), 400

        file = request.files['file']
        if file.filename == '':
            logging.warning("No selected file")
            return jsonify({"error": "No selected file"}), 400

        img_array = preprocess_image(file)
        predictions = model.predict(img_array)
        score = float(predictions[0][0])
        logging.info(f"Prediction score: {score}")
        return jsonify({"score": score})

    except Exception as e:
        logging.error(f"Error during prediction: {e}")
        return jsonify({"error": str(e)}), 500

# Serve the frontend (index.html)
@app.route("/", methods=["GET"])
def home():
    return send_from_directory(app.static_folder, "index.html")

# Optional: Health check route (useful for Render or uptime monitoring)
@app.route("/healthz", methods=["GET"])
def health_check():
    return "OK", 200

# Start the server
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
