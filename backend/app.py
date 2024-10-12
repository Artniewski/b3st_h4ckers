from flask import Flask
from flask_cors import CORS
import os
from routes import init_routes

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Path to save processed files
RESPONSE_FOLDER = 'responses'
if not os.path.exists(RESPONSE_FOLDER):
    os.makedirs(RESPONSE_FOLDER)

# Initialize routes
init_routes(app)

if __name__ == '__main__':
    app.run(debug=True)
