const mockingoose = require('mockingoose');
const Recipe = require('../../models/Recipe');
const Notification = require('../../models/Notification');
const { createRecipe, getAllRecipes, toggleLike } = require('../../controllers/recipeController');
const mongoose = require('mongoose');

describe('Recipe Controller', () => {
  let req, res;

  // Create valid objectIds
  const mockChefId = new mongoose.Types.ObjectId();
  const mockRecipeId = new mongoose.Types.ObjectId();
  const mockUserId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    req = {
      body: {},
      file: { path: 'cloud/image.jpg' },
      user: { id: mockChefId.toString(), email: 'test@example.com', role: 'chef' },
      params: {},
      app: {
        get: () => ({ emit: jest.fn(), fetchSockets: jest.fn().mockResolvedValue([]) })
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  // ============================
  // createRecipe()
  // ============================
  describe('createRecipe()', () => {
    it('should return 403 if user is not a chef', async () => {
      req.user.role = 'user';
      await createRecipe(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Only chefs can create recipes' });
    });

    it('should save recipe and emit socket event', async () => {
      req.body = {
        title: 'Pizza',
        description: 'Cheesy and good',
        ingredients: JSON.stringify(['Cheese', 'Flour']),
        instructions: JSON.stringify(['Step 1', 'Step 2']),
        prepTime: 10,
        cookTime: 20,
        coolTime: 5,
        servings: 4,
        category: 'Italian',
        tags: JSON.stringify(['vegan']),
        nutrition: JSON.stringify({ calories: 200 })
      };

      mockingoose(Recipe).toReturn({ 
        _id: mockRecipeId,
        title: 'Pizza',
        chefId: mockChefId
      }, 'save');

      await createRecipe(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ title: 'Pizza' }));
    });
  });

  // ============================
  // getAllRecipes()
  // ============================
  describe('getAllRecipes()', () => {
    it('should return filtered recipe list', async () => {
      req.query = {
        diet: 'vegan',
        sortBy: 'likes',
        page: 1,
        limit: 2
      };

      mockingoose(Recipe).toReturn([{ title: 'Vegan Pizza' }], 'find');

      await getAllRecipes(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ title: 'Vegan Pizza' })
      ]));
    });
  });

  // ============================
  // toggleLike()
  // ============================
  describe('toggleLike()', () => {
    it('should like a recipe and notify owner', async () => {
      req.user.id = mockUserId.toString();
      req.user.email = 'user1@example.com';
      req.params = { id: mockRecipeId.toString() };

      mockingoose(Recipe).toReturn({
        _id: mockRecipeId,
        title: 'Tasty Dish',
        likes: [],
        comments: [],
        chefId: { _id: mockChefId, email: 'chef@example.com' },
        save: jest.fn()
      }, 'findOne');

      mockingoose(Notification).toReturn({}, 'create');

      await toggleLike(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Liked' });
    });

    it('should remove like if already liked', async () => {
      req.user.id = mockUserId.toString();
      req.params = { id: mockRecipeId.toString() };

      mockingoose(Recipe).toReturn({
        _id: mockRecipeId,
        title: 'Tasty Dish',
        likes: [{ userId: mockUserId }],
        comments: [],
        chefId: { _id: mockChefId, email: 'chef@example.com' },
        save: jest.fn()
      }, 'findOne');

      await toggleLike(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Like removed' });
    });
  });
});
