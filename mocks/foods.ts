import { FoodItem } from "@/types/nutrition";
import { generateId } from "@/utils/helpers";

export const COMMON_FOODS: FoodItem[] = [
  {
    id: "food-1",
    name: "Chicken Breast",
    servingSize: "100",
    servingUnit: "g",
    nutritionPer100g: {
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    },
    image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=2487&auto=format&fit=crop",
    barcode: "0123456789012"
  },
  {
    id: "food-2",
    name: "Brown Rice",
    servingSize: "100",
    servingUnit: "g",
    nutritionPer100g: {
      calories: 112,
      protein: 2.6,
      carbs: 23.5,
      fat: 0.9,
      fiber: 1.8
    },
    image: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?q=80&w=2370&auto=format&fit=crop",
    barcode: "0123456789013"
  },
  {
    id: "food-3",
    name: "Broccoli",
    servingSize: "100",
    servingUnit: "g",
    nutritionPer100g: {
      calories: 34,
      protein: 2.8,
      carbs: 6.6,
      fat: 0.4,
      fiber: 2.6
    },
    image: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?q=80&w=2301&auto=format&fit=crop",
    barcode: "0123456789014"
  },
  {
    id: "food-4",
    name: "Salmon",
    servingSize: "100",
    servingUnit: "g",
    nutritionPer100g: {
      calories: 208,
      protein: 20,
      carbs: 0,
      fat: 13,
    },
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=2370&auto=format&fit=crop",
    barcode: "0123456789015"
  },
  {
    id: "food-5",
    name: "Avocado",
    servingSize: "100",
    servingUnit: "g",
    nutritionPer100g: {
      calories: 160,
      protein: 2,
      carbs: 8.5,
      fat: 14.7,
      fiber: 6.7
    },
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?q=80&w=2375&auto=format&fit=crop",
    barcode: "0123456789016"
  },
  {
    id: "food-6",
    name: "Egg",
    servingSize: "1",
    servingUnit: "large",
    nutritionPer100g: {
      calories: 155,
      protein: 12.6,
      carbs: 1.1,
      fat: 10.6,
    },
    image: "https://images.unsplash.com/photo-1607690424560-35d967d6ad7a?q=80&w=2370&auto=format&fit=crop",
    barcode: "0123456789017"
  },
  {
    id: "food-7",
    name: "Sweet Potato",
    servingSize: "100",
    servingUnit: "g",
    nutritionPer100g: {
      calories: 86,
      protein: 1.6,
      carbs: 20.1,
      fat: 0.1,
      fiber: 3
    },
    image: "https://images.unsplash.com/photo-1596097635121-14b38c5d7a55?q=80&w=2370&auto=format&fit=crop",
    barcode: "0123456789018"
  },
  {
    id: "food-8",
    name: "Greek Yogurt",
    brand: "Generic",
    servingSize: "100",
    servingUnit: "g",
    nutritionPer100g: {
      calories: 59,
      protein: 10,
      carbs: 3.6,
      fat: 0.4,
    },
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=2487&auto=format&fit=crop",
    barcode: "0123456789019"
  },
  {
    id: "food-9",
    name: "Oatmeal",
    servingSize: "100",
    servingUnit: "g",
    nutritionPer100g: {
      calories: 389,
      protein: 16.9,
      carbs: 66.3,
      fat: 6.9,
      fiber: 10.6
    },
    image: "https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?q=80&w=2487&auto=format&fit=crop",
    barcode: "0123456789020"
  },
  {
    id: "food-10",
    name: "Banana",
    servingSize: "1",
    servingUnit: "medium",
    nutritionPer100g: {
      calories: 89,
      protein: 1.1,
      carbs: 22.8,
      fat: 0.3,
      fiber: 2.6,
      sugar: 12.2
    },
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=2380&auto=format&fit=crop",
    barcode: "0123456789021"
  },
  {
    id: "food-11",
    name: "Almonds",
    servingSize: "28",
    servingUnit: "g",
    nutritionPer100g: {
      calories: 579,
      protein: 21.2,
      carbs: 21.7,
      fat: 49.9,
      fiber: 12.5
    },
    image: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?q=80&w=2370&auto=format&fit=crop",
    barcode: "0123456789022"
  },
  {
    id: "food-12",
    name: "Olive Oil",
    servingSize: "1",
    servingUnit: "tbsp",
    nutritionPer100g: {
      calories: 884,
      protein: 0,
      carbs: 0,
      fat: 100,
    },
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=2361&auto=format&fit=crop",
    barcode: "0123456789023"
  },
  {
    id: "food-13",
    name: "Protein Shake",
    brand: "Generic",
    servingSize: "1",
    servingUnit: "scoop",
    nutritionPer100g: {
      calories: 380,
      protein: 80,
      carbs: 7.5,
      fat: 3.5,
    },
    image: "https://images.unsplash.com/photo-1594020931016-de18fe8c5c67?q=80&w=2487&auto=format&fit=crop",
    barcode: "0123456789024"
  },
  {
    id: "food-14",
    name: "Quinoa",
    servingSize: "100",
    servingUnit: "g",
    nutritionPer100g: {
      calories: 120,
      protein: 4.4,
      carbs: 21.3,
      fat: 1.9,
      fiber: 2.8
    },
    image: "https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=2370&auto=format&fit=crop",
    barcode: "0123456789025"
  },
  {
    id: "food-15",
    name: "Spinach",
    servingSize: "100",
    servingUnit: "g",
    nutritionPer100g: {
      calories: 23,
      protein: 2.9,
      carbs: 3.6,
      fat: 0.4,
      fiber: 2.2
    },
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=2360&auto=format&fit=crop",
    barcode: "0123456789026"
  },
  {
    id: "food-16",
    name: "Ground Beef (90% lean)",
    servingSize: "100",
    servingUnit: "g",
    nutritionPer100g: {
      calories: 176,
      protein: 26,
      carbs: 0,
      fat: 8,
    },
    image: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?q=80&w=2487&auto=format&fit=crop",
    barcode: "0123456789027"
  },
  {
    id: "food-17",
    name: "Peanut Butter",
    servingSize: "2",
    servingUnit: "tbsp",
    nutritionPer100g: {
      calories: 588,
      protein: 25,
      carbs: 20,
      fat: 50,
      fiber: 6
    },
    image: "https://images.unsplash.com/photo-1621243804936-775306a8f2e3?q=80&w=2370&auto=format&fit=crop",
    barcode: "0123456789028"
  },
  {
    id: "food-18",
    name: "Blueberries",
    servingSize: "100",
    servingUnit: "g",
    nutritionPer100g: {
      calories: 57,
      protein: 0.7,
      carbs: 14.5,
      fat: 0.3,
      fiber: 2.4,
      sugar: 10
    },
    image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?q=80&w=2369&auto=format&fit=crop",
    barcode: "0123456789029"
  },
  {
    id: "food-19",
    name: "Cottage Cheese",
    servingSize: "100",
    servingUnit: "g",
    nutritionPer100g: {
      calories: 98,
      protein: 11.1,
      carbs: 3.4,
      fat: 4.3,
    },
    image: "https://images.unsplash.com/photo-1559561853-08451507cbe7?q=80&w=2487&auto=format&fit=crop",
    barcode: "0123456789030"
  },
  {
    id: "food-20",
    name: "Turkey Breast",
    servingSize: "100",
    servingUnit: "g",
    nutritionPer100g: {
      calories: 104,
      protein: 24,
      carbs: 0,
      fat: 1,
    },
    image: "https://images.unsplash.com/photo-1606728035253-49e8a23146de?q=80&w=2370&auto=format&fit=crop",
    barcode: "0123456789031"
  },
];

// Helper function to calculate nutrition based on amount
export const calculateNutrition = (food: FoodItem, amount: number): NutritionInfo => {
  const multiplier = amount / 100; // Convert to per 100g
  return {
    calories: Math.round(food.nutritionPer100g.calories * multiplier),
    protein: parseFloat((food.nutritionPer100g.protein * multiplier).toFixed(1)),
    carbs: parseFloat((food.nutritionPer100g.carbs * multiplier).toFixed(1)),
    fat: parseFloat((food.nutritionPer100g.fat * multiplier).toFixed(1)),
    fiber: food.nutritionPer100g.fiber 
      ? parseFloat((food.nutritionPer100g.fiber * multiplier).toFixed(1)) 
      : undefined,
    sugar: food.nutritionPer100g.sugar 
      ? parseFloat((food.nutritionPer100g.sugar * multiplier).toFixed(1)) 
      : undefined,
  };
};

// Helper function to create a food entry
export const createFoodEntry = (
  food: FoodItem, 
  amount: number, 
  mealType: MealType
): FoodEntry => {
  return {
    id: generateId(),
    foodId: food.id,
    name: food.name,
    amount,
    unit: food.servingUnit,
    mealType,
    timestamp: new Date().toISOString(),
    nutrition: calculateNutrition(food, amount),
  };
};

// Import the MealType
import { MealType, FoodEntry, NutritionInfo } from "@/types/nutrition";