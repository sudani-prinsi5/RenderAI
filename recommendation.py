# def recommend(theme,budget):

#     furniture=[]

#     if theme=="Modern":

#         furniture=["Queen Bed","White Wardrobe","Study Table"]

#     elif theme=="Paris":

#         furniture=["Classic Bed",
#                    "Cream Curtain",
#                    "Pendant Light"]

#     return furniture
def recommend(theme, budget):

    furniture = []

    if theme == "Modern":
        furniture = [
            "Queen Bed",
            "White Wardrobe",
            "Study Table"
        ]

    elif theme == "Paris":
        furniture = [
            "Classic Bed",
            "Cream Curtains",
            "Pendant Light"
        ]

    elif theme == "Luxury":
        furniture = [
            "King Bed",
            "Luxury Wardrobe",
            "Chandelier"
        ]

    elif theme == "Gaming":
        furniture = [
            "Gaming Chair",
            "RGB Table",
            "Gaming Desk"
        ]

    elif theme == "Kids":
        furniture = [
            "Kids Bed",
            "Toy Storage",
            "Study Table"
        ]

    return furniture