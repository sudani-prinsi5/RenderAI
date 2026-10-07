import os
import sys

# Ensure backend directory and root directory are in Python path
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

for path in [BACKEND_DIR, BASE_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

# Expose the Flask WSGI application for Render, Gunicorn, and cloud deployments
from backend.app import app


def run_cli():
    """Interactive command-line interface demo mode."""
    from detect import detect_furniture
    from recommendation import recommend
    from constraint_checker import check_constraints

    print("=" * 50)
    print("        AI INTERIOR DESIGN CHATBOT")
    print("=" * 50)

    # Step 1
    image = input("Enter bedroom image path: ")

    print("\nAnalyzing room...\n")

    # Step 2
    objects = detect_furniture(image)

    print("Detected Objects:")

    unique_objects = list(set(objects))

    for obj in unique_objects:
        print("•", obj)

    print("\nWhat would you like to do?")
    print("1. Design New Bedroom")
    print("2. Renovate Current Bedroom")

    choice = input("Enter Choice (1/2): ")

    # Step 3
    if choice == "2":

        print("\nDetected Furniture:")

        for obj in unique_objects:
            print("-", obj)

        print("\nChoose Option")
        print("1. Keep Everything")
        print("2. Replace Some Furniture")
        print("3. Replace Everything")

        option = input("Enter Option: ")

    print("\nChoose Theme")

    print("1. Modern")
    print("2. Paris")
    print("3. Luxury")
    print("4. Gaming")
    print("5. Kids")

    theme_choice = input("Enter Theme Number: ")

    theme_map = {
        "1": "Modern",
        "2": "Paris",
        "3": "Luxury",
        "4": "Gaming",
        "5": "Kids"
    }

    theme = theme_map.get(theme_choice, "Modern")

    budget = int(input("\nEnter Budget (₹): "))

    print("\nGenerating Recommendations...\n")

    items = recommend(theme, budget)

    print("Recommended Furniture\n")

    for item in items:
        print("✓", item)

    print()

    status = check_constraints(unique_objects, items, budget)

    if status:

        print("\nEverything Looks Good!")
        print("Generating Bedroom Design...\n")

    else:

        print("\nPlease Modify Furniture.")

    while True:

        print("\n--------------------------")
        print("Interactive Mode")
        print("--------------------------")

        cmd = input("Enter Change (exit to finish): ")

        if cmd.lower() == "exit":
            break

        if "bookshelf" in cmd.lower():

            items.append("Bookshelf")
            budget += 2500

            print("Bookshelf Added.")

        elif "study table" in cmd.lower():

            items.append("Study Table")
            budget += 4000

            print("Study Table Added.")

        elif "remove wardrobe" in cmd.lower():

            if "Wardrobe" in items:
                items.remove("Wardrobe")

            budget -= 10000

            print("Wardrobe Removed.")

        elif "blue" in cmd.lower():

            print("Wall Color Changed to Blue.")

        else:

            print("Change Applied.")

        print("Updated Budget : ₹", budget)

    print("\nFinal Furniture List\n")

    for i in items:
        print("-", i)

    print("\nEstimated Budget : ₹", budget)

    print("\nThank You For Using AI Interior Designer")


if __name__ == "__main__":
    if "--cli" in sys.argv:
        run_cli()
    else:
        port = int(os.environ.get("PORT", 5000))
        debug_mode = os.environ.get("FLASK_DEBUG", "0").lower() in ("1", "true", "yes")
        print(f"Starting AI Interior Designer Server on 0.0.0.0:{port}...")
        app.run(host="0.0.0.0", port=port, debug=debug_mode)