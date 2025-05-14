from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import os
import logging  # Import the logging module

app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "*"}})  # Allow all origins

# Configure logging
logging.basicConfig(level=logging.INFO)  # Set the logging level

# Load the model
try:
    model_path = 'happy_sad_model.h5'
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at: {model_path}")
    model = load_model(model_path)
    logging.info("Model loaded successfully")  # Log successful model load
except Exception as e:
    logging.error(f"Failed to load model: {e}")  # Log the error
    model = None  # Important: Set model to None if loading fails

# Preprocess image
def preprocess_image(file):
    try:
        img = Image.open(file).convert("RGB")
        img = img.resize((256, 256))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)  # Shape: (1, 256, 256, 3)
        return img_array
    except Exception as e:
        logging.error(f"Error preprocessing image: {e}")
        raise  # Re-raise the exception to be caught in predict()




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
        score = float(predictions[0][0])  # Ensure it's JSON serializable
        logging.info(f"Prediction score: {score}")
        return jsonify({"score": score})

    except Exception as e:
        logging.error(f"Error during prediction: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Model API is running"}), 200
    
if __name__ == "__main__":
    #app.run(debug=True) #remove this line
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
