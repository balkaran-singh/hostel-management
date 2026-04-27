from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.neighbors import NearestNeighbors
import math

app = Flask(__name__)
CORS(app)

REQUIRED_FIELDS = ("sleep", "cleanliness", "noise")
MIN_SCORE = 1
MAX_SCORE = 10


def _feature_vector(student):
    return [
        float(student["sleep"]),
        float(student["cleanliness"]),
        float(student["noise"]),
    ]


def _compatibility_percentage_from_distance(distance):
    # Max Euclidean distance in 3D where each dimension ranges [1, 10].
    # That is between points [1,1,1] and [10,10,10].
    max_distance = math.sqrt(((MAX_SCORE - MIN_SCORE) ** 2) * len(REQUIRED_FIELDS))

    similarity = max(0.0, 1 - (distance / max_distance))
    return round(similarity * 100, 2)


def _validate_student(student, field_name):
    if not isinstance(student, dict):
        return f"{field_name} must be an object"

    missing = [f for f in REQUIRED_FIELDS if f not in student]
    if missing:
        return f"{field_name} is missing fields: {', '.join(missing)}"

    for metric in REQUIRED_FIELDS:
        value = student[metric]
        if not isinstance(value, (int, float)):
            return f"{field_name}.{metric} must be a number"
        if value < MIN_SCORE or value > MAX_SCORE:
            return f"{field_name}.{metric} must be between {MIN_SCORE} and {MAX_SCORE}"

    return None


@app.route("/match", methods=["POST", "OPTIONS"])
def match_students():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    target_student = data.get("target_student")
    queue = data.get("queue")

    target_error = _validate_student(target_student, "target_student")
    if target_error:
        return jsonify({"error": target_error}), 400

    if not isinstance(queue, list):
        return jsonify({"error": "queue must be a list of student objects"}), 400

    if len(queue) == 0:
        return jsonify({"matches": []}), 200

    target_id = target_student.get("id")

    candidates = []
    for i, candidate in enumerate(queue):
        candidate_error = _validate_student(candidate, f"queue[{i}]")
        if candidate_error:
            return jsonify({"error": candidate_error}), 400

        if target_id is not None and candidate.get("id") == target_id:
            continue

        candidates.append(candidate)

    if len(candidates) == 0:
        return jsonify({"matches": []}), 200

    queue_vectors = [_feature_vector(student) for student in candidates]
    target_vector = [_feature_vector(target_student)]
    neighbor_count = min(3, len(candidates))

    knn_model = NearestNeighbors(n_neighbors=neighbor_count, metric="euclidean")
    knn_model.fit(queue_vectors)

    distances, indices = knn_model.kneighbors(target_vector)

    top_matches = []
    for distance, idx in zip(distances[0], indices[0]):
        candidate = candidates[int(idx)]
        percentage = _compatibility_percentage_from_distance(float(distance))
        top_matches.append(
            {
                "id": candidate.get("id"),
                "compatibility": percentage,
                "student": candidate,
            }
        )

    return jsonify({"matches": top_matches}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)
