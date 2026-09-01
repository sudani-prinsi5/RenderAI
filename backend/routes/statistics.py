from flask import Blueprint, jsonify, request
from models import RoomUpload
from extensions import db
import json

statistics = Blueprint("statistics", __name__)

def _load_json(text, default=None):
    if default is None:
        default = []
    if not text:
        return default
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return default

@statistics.route("/statistics", methods=["GET"])
def get_statistics():
    try:
        user_id = request.args.get("user_id", type=int)
        
        query = RoomUpload.query
        if user_id:
            query = query.filter_by(user_id=user_id)
            
        rooms = query.all()
        
        total_rooms = len(rooms)
        empty_rooms = sum(1 for r in rooms if r.is_empty_room)
        processed_rooms = total_rooms - empty_rooms
        
        total_objects_detected = sum(r.total_objects or 0 for r in rooms)
        
        total_budget_spent = 0.0
        designs_with_furniture = 0
        
        # Category distribution of custom added furniture
        furniture_distribution = {
            "bed": 0,
            "sofa": 0,
            "chair": 0,
            "table": 0,
            "wardrobe": 0,
            "desk": 0,
            "lamp": 0,
            "tv": 0
        }
        
        total_area = 0.0
        rooms_with_dims = 0
        
        for r in rooms:
            # Area calculation
            if r.room_length and r.room_width:
                total_area += (r.room_length * r.room_width)
                rooms_with_dims += 1
                
            # Custom furniture state tracking
            items = _load_json(r.furniture_state, [])
            if len(items) > 0:
                designs_with_furniture += 1
                for item in items:
                    name = item.get("name", "").lower()
                    price = item.get("price", 0.0)
                    total_budget_spent += price
                    
                    # Track distribution
                    if name in furniture_distribution:
                        furniture_distribution[name] += 1
                    else:
                        # Try parsing base keyword if not exact match (e.g. dining table -> table)
                        matched = False
                        for cat in furniture_distribution:
                            if cat in name:
                                furniture_distribution[cat] += 1
                                matched = True
                                break
                        if not matched:
                            furniture_distribution["table"] = furniture_distribution.get("table", 0) + 1

        avg_room_area = round(total_area / rooms_with_dims, 2) if rooms_with_dims > 0 else 0.0
        
        return jsonify({
            "success": True,
            "statistics": {
                "total_rooms": total_rooms,
                "empty_rooms": empty_rooms,
                "processed_rooms": processed_rooms,
                "total_objects_detected": total_objects_detected,
                "designs_with_furniture": designs_with_furniture,
                "total_budget_spent": total_budget_spent,
                "avg_room_area": avg_room_area,
                "furniture_distribution": furniture_distribution
            }
        })
        
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
