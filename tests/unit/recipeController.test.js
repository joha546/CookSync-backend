const mockingoose = require('mockingoose');
const Recipe = require('../../models/Recipe');
const Notification = require('../../models/Notification');
const { createRecipe, getAllRecipes, toggleLike, getRecipeById, updateRecipe, deleteRecipe, addView, addComment, deleteComment } = require('../../controllers/recipeController');
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


describe('Recipe Controller - Additional Functions', () => {
  const mockUserId = new mongoose.Types.ObjectId();
  const mockRecipeId = new mongoose.Types.ObjectId();
  const mockCommentId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    req = {
      user: { id: mockUserId.toString(), email: 'user@example.com' },
      params: {},
      body: {},
      app: {
        get: () => ({
          fetchSockets: jest.fn().mockResolvedValue([])
        })
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  // getRecipeById()
  describe('getRecipeById()', () => {
    it('should return 404 if recipe not found', async () => {
      req.params = { id: mockRecipeId.toString() };
      mockingoose(Recipe).toReturn(null, 'findOne');

      await getRecipeById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return recipe if found', async () => {
      req.params = { id: mockRecipeId.toString() };
      mockingoose(Recipe).toReturn({ _id: mockRecipeId, title: 'Cake' }, 'findOne');

      await getRecipeById(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ title: 'Cake' }));
    });
  });

  // updateRecipe()
  describe('updateRecipe()', () => {
    it('should update and return the recipe', async () => {
      req.params = { id: mockRecipeId.toString() };
      req.body = { title: 'Updated Title' };

      mockingoose(Recipe).toReturn({ _id: mockRecipeId, title: 'Updated Title' }, 'findOneAndUpdate');
      await updateRecipe(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated Title' }));
    });
  });

  // deleteRecipe()
  describe('deleteRecipe()', () => {
    it('should delete the recipe and respond', async () => {
      req.params = { id: mockRecipeId.toString() };
      mockingoose(Recipe).toReturn({}, 'findOneAndDelete');

      await deleteRecipe(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Recipe deleted' });
    });
  });

  // addView()
  // describe('addView()', () => {
  //   it('should record view if not already viewed', async () => {
  //     req.user.id = mockUserId.toString();
  //     req.params = { id: mockRecipeId.toString() };
      
  //     const mockRecipe = {
  //       _id: mockRecipeId,
  //       views: [],
  //       save: jest.fn().mockResolvedValue()
  //     };

  //     mockingoose(Recipe).toReturn(mockRecipe, 'findOne')

  //     await addView(req, res);

  //     expect(mockRecipe.save).toHaveBeenCalled();
  //     expect(res.json).toHaveBeenCalledWith({ message: 'View recorded' });
  //   });

  //   it('should skip adding view if already viewed', async () => {
  //     req.params = { id: mockRecipeId.toString() };
  //     mockingoose(Recipe).toReturn({
  //       _id: mockRecipeId,
  //       views: [{ userId: mockUserId }],
  //       save: jest.fn()
  //     }, 'findOne');

  //     await addView(req, res);
  //     expect(res.json).toHaveBeenCalledWith({ message: 'View recorded' });
  //   });
  // });

  // addComment()
  describe('addComment()', () => {
    it('should return 400 if comment text missing', async () => {
      req.params = { id: mockRecipeId.toString() };
      req.body = { text: '' };
      await addComment(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should add comment and send notification', async () => {
      req.params = { id: mockRecipeId.toString() };
      req.body = { text: 'Nice recipe!' };
      req.user.email = 'user@example.com';
      req.user.id = mockUserId.toString();

      mockingoose(Recipe).toReturn({
        _id: mockRecipeId,
        title: 'Pasta',
        chefId: { _id: new mongoose.Types.ObjectId() },
        comments: [],
        save: jest.fn()
      }, 'findOne');
      mockingoose(Notification).toReturn({}, 'create');

      await addComment(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment added.' });
    });
  });

  // deleteComment()
  // describe('deleteComment()', () => {
  //   it('should delete comment if user is author', async () => {
  //     req.user.id = mockUserId.toString();
  //     req.params = { id: mockRecipeId.toString(), commentId: mockCommentId.toString() };

  //     const mockRemove = jest.fn().mockResolvedValue();
  //     const mockSave = jest.fn().mockResolvedValue();

  //     const recipeMock = {
  //       _id: mockRecipeId,
  //       save: mockSave,
  //       comments: {
  //           id: jest.fn().mockReturnValue({
  //               _id: mockCommentId,
  //               userId: mockUserId,
  //               remove: mockRemove
  //           })
  //       }
  //     };

  //     mockingoose(Recipe).toReturn(recipeMock, 'findOne');

  //     await deleteComment(req, res);
      
  //     expect(mockRemove).toHaveBeenCalled();
  //     expect(mockSave).toHaveBeenCalled();
  //     expect(res.json).toHaveBeenCalledWith({message: 'Comment deleted'});
  //   });

  //   it('should return 403 if user is not comment owner', async () => {
  //     req.user.id = new mongoose.Types.ObjectId().toString();
  //     req.params = { id: mockRecipeId.toString(), commentId: mockCommentId.toString() };

  //     const recipeMock = {
  //       _id: mockRecipeId,
  //       comments: [{
  //         _id: mockCommentId,
  //         userId: mockUserId,
  //         remove: jest.fn()
  //       }],
  //       save: jest.fn()
  //     };

  //     recipeMock.comments.id = jest.fn().mockReturnValue(recipeMock.comments[0]);

  //     mockingoose(Recipe).toReturn(recipeMock, 'findOne');
  //     await deleteComment(req, res);

  //     expect(res.status).toHaveBeenCalledWith(403);
  //   });
  // });
});