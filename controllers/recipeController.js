const Recipe = require("../models/Recipe");
const Notification = require("../models/Notification");
const getRefId = require("../utils/getRefId");
const { parseJsonField, ValidationError } = require("../utils/parseJsonField");

exports.createRecipe = async (req, res) => {
    try {
        //Only a chef can post.
        if (req.user.role !== "chef") {
            return res
                .status(403)
                .json({ error: "Only chefs can create recipes" });
        }
        const {
            title,
            description,
            ingredients,
            instructions,
            servings,
            prepTime,
            cookTime,
            coolTime,
            category,
            tags,
            nutrition,
        } = req.body;

        const totalTime =
            Number(prepTime) + Number(cookTime) + Number(coolTime);

        const recipe = new Recipe({
            title,
            description,
            ingredients: parseJsonField(ingredients, "ingredients"),
            instructions: parseJsonField(instructions, "instructions"),
            imageUrl: req.file?.path,
            servings,
            prepTime,
            cookTime,
            coolTime,
            totalTime,
            category,
            tags: parseJsonField(tags, "tags"),
            nutrition: parseJsonField(nutrition, "nutrition"),
            chefId: req.user.id, // Always use authenticated userID.
        });

        await recipe.save();

        // Emit new recipe event.
        const io = req.app.get("io");
        io.emit("new-recipe", recipe);

        res.status(201).json(recipe);
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        console.error(error);
        res.status(500).json({ error: "Failed to create recipe" });
    }
};

// get all recipes
exports.getAllRecipes = async (req, res) => {
    const { diet, sortBy = "new", page = 1, limit = 10 } = req.query;
    const query = {};

    // Filter based on diet preferences
    if (diet) {
        query.tags = { $in: [diet] }; // tags must include the dietary label
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    try {
        let recipes;

        if (sortBy === "likes" || sortBy === "views") {
            const countField = sortBy === "likes" ? "likeCount" : "viewCount";
            const arrayField = sortBy === "likes" ? "$likes" : "$views";

            const aggregated = await Recipe.aggregate([
                { $match: query },
                { $addFields: { [countField]: { $size: arrayField } } },
                { $sort: { [countField]: -1 } },
                { $skip: skip },
                { $limit: limitNum },
            ]);

            const ids = aggregated.map((r) => r._id);
            const orderMap = new Map(ids.map((id, index) => [id.toString(), index]));

            recipes = await Recipe.find({ _id: { $in: ids } })
                .populate("likes.userId", "email")
                .populate("comments.userId", "email");

            recipes.sort(
                (a, b) =>
                    orderMap.get(a._id.toString()) - orderMap.get(b._id.toString())
            );
        } else {
            recipes = await Recipe.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("likes.userId", "email")
                .populate("comments.userId", "email");
        }

        res.json(recipes);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch recipes." });
    }
};

exports.getRecipeById = async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(recipe);
};

exports.updateRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).json({ error: "Recipe not found" });
        }

        if (recipe.chefId.toString() !== req.user.id) {
            return res
                .status(403)
                .json({ error: "Not authorized to update this recipe" });
        }

        const updated = await Recipe.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Failed to update recipe" });
    }
};

exports.deleteRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).json({ error: "Recipe not found" });
        }

        if (recipe.chefId.toString() !== req.user.id) {
            return res
                .status(403)
                .json({ error: "Not authorized to delete this recipe" });
        }

        await recipe.deleteOne();

        res.json({ message: "Recipe deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete recipe" });
    }
};

exports.deleteRecipeByAdmin = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).json({ error: "Recipe not found" });
        }

        await recipe.deleteOne();

        res.json({ message: "Recipe deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete recipe" });
    }
};

// Like, comment, view controllers.

// Toggle Like.
exports.toggleLike = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const recipe = await Recipe.findById(id).populate("chefId", "email");

        if (!recipe) {
            return res.status(404).json({ error: "Recipe not found" });
        }

        const existing = recipe.likes.find(
            (like) => like.userId.toString() === userId
        );

        if (existing) {
            recipe.likes = recipe.likes.filter(
                (like) => like.userId.toString() !== userId
            );
            await recipe.save();
            return res.json({ message: "Like removed" });
        }

        recipe.likes.push({ userId });
        await recipe.save();

        const chefId = getRefId(recipe.chefId);

        // Send notification to recipe owner (if not liking their own)
        if (chefId && chefId.toString() !== userId) {
            const notif = await Notification.create({
                user: chefId,
                message: `${req.user.email} liked your recipe "${recipe.title}"`,
                link: `/recipes/${recipe._id}`,
                type: "like",
            });

            // emit real-time notification if they're connected
            const io = req.app.get("io");
            const sockets = await io.fetchSockets();

            sockets.forEach((sock) => {
                if (
                    sock.user &&
                    sock.user._id.toString() === chefId.toString()
                ) {
                    sock.emit("new-notification", {
                        type: "like",
                        message: notif.message,
                        link: notif.link,
                        createdAt: notif.createdAt,
                    });
                }
            });
        }

        res.json({ message: "Liked" });
    } catch (error) {
        console.error("❌ toggleLike error:", error.message);
        res.status(500).json({ error: "Failed to toggle like" });
    }
};

// Add view.
exports.addView = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const recipe = await Recipe.findById(id);

        if (!recipe) {
            return res.status(404).json({ error: "Recipe not found" });
        }

        const alreadyViewed = recipe.views.find(
            (view) => view.userId.toString() === userId
        );

        if (!alreadyViewed) {
            recipe.views.push({ userId });
            await recipe.save();
        }

        res.json({ message: "View recorded" });
    } catch (error) {
        res.status(500).json({ error: "Failed to record view" });
    }
};

// Add comment.
exports.addComment = async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text) {
        return res.status(400).json({ error: "Comment text is required" });
    }

    try {
        const recipe = await Recipe.findById(id).populate('chefId', 'email');

        if (!recipe) {
            return res.status(404).json({ error: "Recipe not found" });
        }

        recipe.comments.push({ userId, text });
        await recipe.save();

        const chefId = getRefId(recipe.chefId);

        // Notify recipe owner (if not commenting on own recipe)
        if (chefId.toString() !== userId) {
            const notif = await Notification.create({
                user: chefId,
                message: `${req.user.email} commented on your recipe "${recipe.title}"`,
                link: `/recipes/${recipe._id}`,
                type: "comment",
            });

            // Real time notification emit
            const io = req.app.get("io");
            const sockets = await io.fetchSockets();

            sockets.forEach((sock) => {
                if (
                    sock.user &&
                    sock.user._id.toString() === chefId.toString()
                ) {
                    sock.emit("new-notification", {
                        type: "comment",
                        message: notif.message,
                        link: notif.link,
                        createdAt: notif.createdAt,
                    });
                }
            });
        }

        res.json({ message: "Comment added." });
    } catch (error) {
        console.error("addComment error:", error.message);
        res.status(500).json({ error: "Failed to add comment" });
    }
};

// Delete comment.
exports.deleteComment = async (req, res) => {
    const { id, commentId } = req.params;
    const userId = req.user.id;

    try {
        const recipe = await Recipe.findById(id);

        if (!recipe) {
            return res.status(404).json({ error: "Recipe not found" });
        }

        const comment = recipe.comments.id(commentId);

        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (comment.userId.toString() !== userId) {
            return res
                .status(403)
                .json({ error: "Not authorized to delte this comment." });
        }

        recipe.comments.pull(commentId);
        await recipe.save();
        res.json({ message: "Comment deleted." });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete comment" });
    }
};

exports.getActiveSessions = async (req, res) => {
    try {
        const sessions = await Recipe.find({ activeSession: true })
            .select("title chefId activeSession")
            .populate("chefId", "email");

        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch active sessions" });
    }
};

exports.endSession = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        const userId = req.user.id;

        if (!recipe) {
            return res.status(404).json({ message: "Recipe not found" });
        }

        if (recipe.chefId.toString() !== userId.toString()) {
            return res
                .status(403)
                .json({ message: "Only the chef can end the session" });
        }

        recipe.activeSession = false;
        await recipe.save();

        // Emit session end if users are online.
        req.app
            .get("io")
            .to(recipe._id.toString())
            .emit("session-ended", {
                message: `Chef ${req.user.email} ended the session`,
                roomId: recipe._id,
            });

        res.json({ message: "Session ended successfully" });
    } catch (error) {
        console.error("End session error: ", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getRecipesByChef = async (req, res) => {
    try {
        const recipes = await Recipe.find({ chefId: req.user.id })
            .select("-__v -createdAt -updatedAt")
            .populate("likes.userId", "email")
            .populate("comments.userId", "email");

        res.json(recipes);
    } catch (error) {
        console.error("❌ getRecipesByChef error:", error.message);
        res.status(500).json({ error: "Failed to fetch recipes" });
    }
};
