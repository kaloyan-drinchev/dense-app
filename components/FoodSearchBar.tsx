import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/constants/colors';
import { Feather as Icon } from '@expo/vector-icons';
import { FoodItem } from '@/types/nutrition';
import { COMMON_FOODS } from '@/mocks/foods';

interface FoodSearchBarProps {
  onSelectFood: (food: FoodItem) => void;
  onScanFood: () => void;
}

export const FoodSearchBar: React.FC<FoodSearchBarProps> = ({
  onSelectFood,
  onScanFood,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (query.length > 1) {
      const filteredResults = COMMON_FOODS.filter(
        (food) =>
          food.name.toLowerCase().includes(query.toLowerCase()) ||
          (food.brand && food.brand.toLowerCase().includes(query.toLowerCase()))
      );
      setResults(filteredResults);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const handleSelectFood = (food: FoodItem) => {
    onSelectFood(food);
    setQuery('');
    setShowResults(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Icon
            name="search"
            size={20}
            color={colors.lightGray}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search for a food..."
            placeholderTextColor={colors.lightGray}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Icon name="x" size={20} color={colors.lightGray} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.scanButton} onPress={onScanFood}>
          <Icon name="camera" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {showResults && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelectFood(item)}
              >
                {item.image && (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.foodImage}
                    contentFit="cover"
                  />
                )}
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  {item.brand && (
                    <Text style={styles.foodBrand}>{item.brand}</Text>
                  )}
                  <Text style={styles.foodCalories}>
                    {item.nutritionPer100g.calories} cal per {item.servingSize}{' '}
                    {item.servingUnit}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyResults}>
                <Text style={styles.emptyResultsText}>No foods found</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.white,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  scanButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 300,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  foodImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 2,
  },
  foodBrand: {
    fontSize: 14,
    color: colors.lightGray,
    marginBottom: 2,
  },
  foodCalories: {
    fontSize: 14,
    color: colors.lighterGray,
  },
  emptyResults: {
    padding: 16,
    alignItems: 'center',
  },
  emptyResultsText: {
    color: colors.lightGray,
    fontSize: 16,
  },
});
