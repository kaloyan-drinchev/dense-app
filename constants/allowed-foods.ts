export interface FoodItem {
  name: string;
  details?: string;
  // Nutrition per standard serving
  servingSize: string; // e.g., "200g", "1 medium", "1 cup"
  calories: number;
  protein: number; // grams
  carbs: number; // grams  
  fat: number; // grams
}

export interface FoodCategory {
  id: string;
  name: string;
  icon: string;
  foods: FoodItem[];
}

export interface MealRecipe {
  id: string;
  name: string;
  description: string;
  category: string;
}

export const allowedFoodCategories: FoodCategory[] = [
  {
    id: 'proteins',
    name: 'Proteins',
    icon: '🥩',
    foods: [
      {
        name: 'Chicken breast',
        details: 'Lean, staple protein',
        servingSize: '200g cooked',
        calories: 360,
        protein: 68,
        carbs: 0,
        fat: 8
      },
      {
        name: 'Turkey breast',
        details: 'Same profile as chicken, alternate option',
        servingSize: '200g cooked',
        calories: 355,
        protein: 65,
        carbs: 0,
        fat: 9
      },
      {
        name: 'Lean beef steak & mince',
        details: 'Iron, zinc, creatine',
        servingSize: '150g cooked',
        calories: 350,
        protein: 50,
        carbs: 0,
        fat: 15
      },
      {
        name: 'Eggs + egg whites',
        details: 'Testosterone, choline, flexible macros',
        servingSize: '3 large eggs',
        calories: 210,
        protein: 18,
        carbs: 1,
        fat: 15
      },
      {
        name: 'Protein yogurt, cottage cheese, skyr',
        details: 'Slow digesting, high protein',
        servingSize: '200g',
        calories: 140,
        protein: 20,
        carbs: 10,
        fat: 3
      },
      {
        name: 'Whey protein',
        details: 'Fast digesting, post workout',
        servingSize: '1 scoop (30g)',
        calories: 120,
        protein: 25,
        carbs: 2,
        fat: 1
      }
    ]
  },
  {
    id: 'carbs',
    name: 'Carbs',
    icon: '🍚',
    foods: [
      {
        name: 'Rice',
        details: 'Easy digesting, staple',
        servingSize: '100g dry weight',
        calories: 350,
        protein: 7,
        carbs: 77,
        fat: 1
      },
      {
        name: 'Potatoes & sweet potatoes',
        details: 'Satiety, potassium',
        servingSize: '300g cooked',
        calories: 230,
        protein: 6,
        carbs: 52,
        fat: 0
      },
      {
        name: 'Oats',
        details: 'Slow digesting, breakfast',
        servingSize: '80g dry weight',
        calories: 300,
        protein: 11,
        carbs: 54,
        fat: 6
      },
      {
        name: 'Bread & Bagels',
        details: 'Fast carbs, around workouts',
        servingSize: '2 slices / 1 bagel',
        calories: 160,
        protein: 6,
        carbs: 30,
        fat: 2
      },
      {
        name: 'Rice cakes',
        details: 'Snack base, versatile with spreads',
        servingSize: '4 rice cakes',
        calories: 140,
        protein: 3,
        carbs: 28,
        fat: 1
      },
      {
        name: 'Popcorn',
        details: 'Low-fat snack',
        servingSize: '1 bag (25g)',
        calories: 100,
        protein: 3,
        carbs: 20,
        fat: 2
      }
    ]
  },
  {
    id: 'fats',
    name: 'Fats',
    icon: '🥑',
    foods: [
      {
        name: 'Olive oil',
        details: 'Measured, monounsaturated',
        servingSize: '1 tbsp (15ml)',
        calories: 120,
        protein: 0,
        carbs: 0,
        fat: 14
      },
      {
        name: 'Avocado',
        details: 'Vitamin E, potassium',
        servingSize: '1/2 medium avocado',
        calories: 160,
        protein: 2,
        carbs: 9,
        fat: 15
      },
      {
        name: 'Nuts',
        details: 'Almonds, walnuts — controlled portions',
        servingSize: '30g handful',
        calories: 180,
        protein: 7,
        carbs: 6,
        fat: 15
      },
      {
        name: 'Peanut butter/almond butter',
        details: 'Measured, satiety',
        servingSize: '2 tbsp',
        calories: 190,
        protein: 8,
        carbs: 8,
        fat: 16
      },
      {
        name: 'Egg yolks',
        details: 'Cholesterol, hormones',
        servingSize: '3 yolks',
        calories: 165,
        protein: 8,
        carbs: 2,
        fat: 14
      },
      {
        name: 'Light mayo',
        details: 'Low-calorie option for taste',
        servingSize: '1 tbsp',
        calories: 50,
        protein: 0,
        carbs: 1,
        fat: 5
      },
      {
        name: 'Dark Chocolate 80%+',
        details: 'Antioxidants, controlled portions',
        servingSize: '25g square',
        calories: 140,
        protein: 3,
        carbs: 8,
        fat: 9
      }
    ]
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    icon: '🥬',
    foods: [
      {
        name: 'Mixed vegetables',
        details: 'Tomato, cucumber, bell pepper, carrots',
        servingSize: '200g mixed',
        calories: 40,
        protein: 2,
        carbs: 8,
        fat: 0
      },
      {
        name: 'Broccoli',
        details: 'Fiber, vitamins',
        servingSize: '200g cooked',
        calories: 50,
        protein: 5,
        carbs: 10,
        fat: 1
      },
      {
        name: 'Cauliflower',
        details: 'Low carb substitute',
        servingSize: '200g cooked',
        calories: 50,
        protein: 4,
        carbs: 10,
        fat: 0
      },
      {
        name: 'Mushrooms',
        details: 'Umami flavor, low calorie',
        servingSize: '200g cooked',
        calories: 40,
        protein: 6,
        carbs: 6,
        fat: 1
      },
      {
        name: 'Large salad',
        details: 'Iceberg, spinach, Italian mix',
        servingSize: '300g mixed greens',
        calories: 30,
        protein: 3,
        carbs: 6,
        fat: 0
      },
      {
        name: 'Pickles',
        details: 'Low cal, adds crunch, electrolytes',
        servingSize: '100g',
        calories: 10,
        protein: 0,
        carbs: 2,
        fat: 0
      }
    ]
  },
  {
    id: 'fruits',
    name: 'Fruits',
    icon: '🍌',
    foods: [
      {
        name: 'Banana',
        details: 'Potassium, pre/post workout',
        servingSize: '1 medium banana',
        calories: 105,
        protein: 1,
        carbs: 27,
        fat: 0
      },
      {
        name: 'Blueberries',
        details: 'Fresh or frozen, antioxidants',
        servingSize: '150g cup',
        calories: 85,
        protein: 1,
        carbs: 21,
        fat: 0
      },
      {
        name: 'Berries mix',
        details: 'Raspberries, strawberries - low calorie',
        servingSize: '150g mixed',
        calories: 50,
        protein: 1,
        carbs: 12,
        fat: 0
      },
      {
        name: 'Orange',
        details: 'Vitamin C, hydration',
        servingSize: '1 medium orange',
        calories: 60,
        protein: 1,
        carbs: 15,
        fat: 0
      }
    ]
  },
  {
    id: 'flavor-boosters',
    name: 'Flavor Boosters',
    icon: '🌶️',
    foods: [
      {
        name: 'Seasonings & Spices',
        details: 'Tabasco, chili flakes, oregano, garlic',
        servingSize: 'As needed',
        calories: 5,
        protein: 0,
        carbs: 1,
        fat: 0
      },
      {
        name: 'Mustard',
        details: 'Low calorie condiment',
        servingSize: '1 tbsp',
        calories: 10,
        protein: 0,
        carbs: 1,
        fat: 0
      },
      {
        name: 'Soy sauce',
        details: 'Umami flavor',
        servingSize: '1 tbsp',
        calories: 8,
        protein: 1,
        carbs: 1,
        fat: 0
      },
      {
        name: 'Vinegars & Lemon',
        details: 'Balsamic vinegar, lemon juice',
        servingSize: '1 tbsp',
        calories: 5,
        protein: 0,
        carbs: 1,
        fat: 0
      },
      {
        name: 'Fresh herbs',
        details: 'Parsley, dill, basil, cilantro',
        servingSize: 'As needed',
        calories: 2,
        protein: 0,
        carbs: 0,
        fat: 0
      }
    ]
  }
];

export const mealRecipeCategories = [
  {
    id: 'breakfast',
    name: 'Breakfast Options',
    recipes: [
      {
        id: 'egg-bell-pepper',
        name: 'Egg & Bell Pepper Plate',
        description: '2 fried eggs (low heat, no oil) + 1 whole bell pepper'
      },
      {
        id: 'egg-white-omelette',
        name: 'Egg White Omelette',
        description: '4 egg whites + 1 whole egg + spinach + black pepper'
      },
      {
        id: 'protein-yogurt-bowl',
        name: 'Protein Yogurt Bowl',
        description: '200g low-fat yogurt, banana slices, cinnamon'
      },
      {
        id: 'oats-banana-fuel',
        name: 'Oats & Banana Fuel',
        description: '50g oats cooked in water, 1 sliced banana, sprinkle cinnamon'
      },
      {
        id: 'avocado-eggs-toast',
        name: 'Avocado & Eggs Toast',
        description: '2 boiled eggs + ½ avocado spread on whole-grain bread + chili flakes'
      }
    ]
  },
  {
    id: 'chicken',
    name: 'Chicken Meals',
    recipes: [
      {
        id: 'classic-chicken-rice',
        name: 'Classic Chicken & Rice',
        description: '200g grilled chicken breast + 100g rice + steamed broccoli'
      },
      {
        id: 'soy-garlic-chicken',
        name: 'Soy Garlic Chicken',
        description: 'Chicken breast stir-fried in soy sauce, garlic, ginger + zucchini + rice'
      },
      {
        id: 'chicken-potato-salad',
        name: 'Chicken & Potato Salad',
        description: 'Baked potatoes + diced chicken breast + cucumber + mustard dressing'
      },
      {
        id: 'mediterranean-chicken',
        name: 'Mediterranean Chicken Plate',
        description: 'Chicken breast + tomato, cucumber, red pepper salad + olive oil + oregano'
      },
      {
        id: 'spicy-chicken-bowl',
        name: 'Spicy Chicken Bowl',
        description: 'Chicken breast + rice + spinach + tabasco'
      },
      {
        id: 'chicken-salad-bowl',
        name: 'Chicken Salad Bowl',
        description: '200g chicken breast + ½ iceberg head + spinach + 10g mayo + mustard + pickles + tabasco'
      },
      {
        id: 'chicken-popcorn-combo',
        name: 'Chicken & Popcorn Combo',
        description: 'Grilled chicken breast + 1 bag low-fat popcorn (movie-night macro-friendly meal)'
      },
      {
        id: 'buffalo-chicken-salad',
        name: 'Buffalo Chicken Salad',
        description: 'Chicken breast + iceberg lettuce + tabasco + pickles + cucumber + light mayo-mustard dressing'
      }
    ]
  },
  {
    id: 'beef',
    name: 'Beef Meals',
    recipes: [
      {
        id: 'steak-potato-plate',
        name: 'Steak & Potato Plate',
        description: 'Lean beef steak (150g) + baked potatoes + side salad (tomato, cucumber)'
      },
      {
        id: 'beef-chili-bowl',
        name: 'Beef Chili Bowl',
        description: 'Lean beef mince + rice + tomato + chili spice blend'
      },
      {
        id: 'asian-beef-stir-fry',
        name: 'Asian Beef Stir Fry',
        description: 'Beef strips + soy sauce + broccoli + mushrooms + rice'
      },
      {
        id: 'steakhouse-beef-bowl',
        name: 'Steakhouse Beef Bowl',
        description: 'Beef steak + char-grilled spice rub + rice + zucchini'
      },
      {
        id: 'beef-avocado-salad',
        name: 'Beef & Avocado Salad',
        description: 'Sliced steak + avocado + bell pepper + balsamic vinegar'
      },
      {
        id: 'beef-pickle-plate',
        name: 'Beef Steak & Pickle Plate',
        description: '150g lean steak + oven potatoes + pickles + iceberg salad'
      },
      {
        id: 'beef-burger-bowl',
        name: 'Beef Burger Bowl',
        description: 'Beef mince (5%) + iceberg lettuce base + tomato + mustard + pickles (deconstructed burger)'
      },
      {
        id: 'beef-broccoli-bowl',
        name: 'Beef & Broccoli Bowl',
        description: 'Beef mince + broccoli + soy sauce + garlic + rice'
      }
    ]
  },
  {
    id: 'egg-based',
    name: 'Egg-Based Meals',
    recipes: [
      {
        id: 'egg-steak-breakfast',
        name: 'Egg & Steak Breakfast',
        description: '2 eggs + 100g beef steak + cucumber slices'
      },
      {
        id: 'scrambled-eggs-veggies',
        name: 'Scrambled Eggs with Veggies',
        description: '3 eggs scrambled with tomato + spinach + chili flakes'
      },
      {
        id: 'egg-white-wrap',
        name: 'Egg White Wrap',
        description: 'Omelette wrap with chicken breast + bell pepper filling'
      },
      {
        id: 'egg-salad-mix',
        name: 'Egg & Salad Mix',
        description: '3 eggs + ½ iceberg lettuce + cucumber + tabasco'
      },
      {
        id: 'egg-white-protein-wrap',
        name: 'Egg White Protein Wrap',
        description: 'Egg white omelette used as a wrap with chicken + spinach + mustard'
      }
    ]
  },
  {
    id: 'snacks',
    name: 'Snack / Lighter Options',
    recipes: [
      {
        id: 'protein-shake-rice-cakes',
        name: 'Protein Shake & Rice Cakes',
        description: 'Whey protein + 2 rice cakes + almond butter'
      },
      {
        id: 'yogurt-almonds-bowl',
        name: 'Yogurt & Almonds Bowl',
        description: '200g protein yogurt + 15g almonds + blueberries'
      },
      {
        id: 'cottage-cheese-cucumber',
        name: 'Cottage Cheese & Cucumber Bowl',
        description: 'Cottage cheese + cucumber + dill'
      },
      {
        id: 'banana-peanut-butter',
        name: 'Banana & Peanut Butter Snack',
        description: '1 banana + 15g peanut butter'
      },
      {
        id: 'peanut-butter-rice-cakes',
        name: 'Peanut Butter & Rice Cakes',
        description: 'Rice cakes topped with peanut butter + sea salt'
      },
      {
        id: 'bagel-protein-sandwich',
        name: 'Bagel Protein Sandwich',
        description: '1 bagel + cottage cheese spread + turkey breast slices + cucumber'
      },
      {
        id: 'rice-cakes-skyr',
        name: 'Rice Cakes & Skyr',
        description: '2 rice cakes topped with skyr + raspberries'
      }
    ]
  },
  {
    id: 'sweet-options',
    name: 'Sweet Options',
    recipes: [
      {
        id: 'blueberry-protein-cream',
        name: 'Blueberry Protein Cream',
        description: 'Yogurt + frozen blueberries (blend or eat cold like ice cream)'
      },
      {
        id: 'frozen-berry-yogurt',
        name: 'Frozen Berry Yogurt Bowl',
        description: 'Protein yogurt + frozen raspberries + cinnamon'
      },
      {
        id: 'strawberry-skyr-mix',
        name: 'Strawberry Skyr Mix',
        description: 'Skyr + strawberries + drizzle of lemon juice'
      }
    ]
  }
];
