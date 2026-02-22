import json
from typing import List, Tuple, Union, Optional, Any
import numpy as np

from app.db.models import User

def cosine_similarity(v1: Union[str, List[float], np.ndarray], v2: Union[str, List[float], np.ndarray]) -> float:
    """Computes cosine similarity between two vectors (supports JSON string from DB).

    Args:
        v1: First vector (JSON string, list, or NumPy array).
        v2: Second vector (JSON string, list, or NumPy array).

    Returns:
        Cosine similarity in [-1.0, 1.0].
    """
    if isinstance(v1, str):
        v1 = json.loads(v1)
    if isinstance(v2, str):
        v2 = json.loads(v2)

    vec1: np.ndarray = np.array(v1, dtype=np.float32).flatten()
    vec2: np.ndarray = np.array(v2, dtype=np.float32).flatten()

    dot_product: float = float(np.dot(vec1, vec2))
    norm_vec1: float = float(np.linalg.norm(vec1))
    norm_vec2: float = float(np.linalg.norm(vec2))

    if norm_vec1 == 0 or norm_vec2 == 0:
        return 0.0
    
    return float(dot_product / (norm_vec1 * norm_vec2))
    
def find_best_match(
    target_embedding: Union[str, List[float], np.ndarray],
    user_list: List[User]
) -> Tuple[Optional[User], float]:
    """Finds the user whose face embedding is most similar to the target vector.

    Args:
        target_embedding: Query embedding (JSON string, list, or array).
        user_list: List of `User` objects to compare against.

    Returns:
        (Best-matching user or None, similarity score).
    """
    best_user: Optional[User] = None
    max_similarity: float = -1.0

    for user in user_list:
        similarity: float = cosine_similarity(target_embedding, user.face_embedding)
        if similarity > max_similarity:
            max_similarity = similarity
            best_user = user
            
    return best_user, max_similarity


    