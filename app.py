
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