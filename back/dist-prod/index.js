import express from "express";
import cors from "cors";
import z from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
const PORT = process.env.PORT || 3000;
const app = express();
// Middleware
app.use(cors());
app.use(express.json());
// Config BD
const url = "mongodb+srv://diarrassoubazie59_db_user:Gdn9jcRiatJand6b@cluster0.rymmimu.mongodb.net/?appName=Cluster0";
const connectdb = async (url) => {
    try {
        await mongoose.connect(url);
        console.log("Connected to MongoDB");
    }
    catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};
connectdb(url);
// JWT Config
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret_key";
const revokedTokens = new Set();
// Modèles Mongoose
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: "user" },
    createdAt: { type: Date, default: Date.now },
});
const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    invitationCode: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
});
// CORRECTION: Enum des statuts corrigé
const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "in_progress", "completed"], // CORRIGÉ: valeurs valides
        default: "pending",
    },
    deadline: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: "admin" },
    createdAt: { type: Date, default: Date.now },
});
const userModel = mongoose.model("User", userSchema);
const groupModel = mongoose.model("Group", groupSchema);
const taskModel = mongoose.model("Task", taskSchema);
const adminModel = mongoose.model("Admin", adminSchema);
// Validation Schemas
const createUserSchema = z.object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    password: z
        .string()
        .min(6)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Pas assez complexe"),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Mot de passe requis"),
});
const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    deadline: z
        .string()
        .optional()
        .nullable()
        .transform((val) => (val ? new Date(val) : null)),
    groupId: z.string(),
});
const createGroupSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});
// Utility Functions
const generateTokens = (payload) => ({
    accessToken: jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" }),
    refreshToken: jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" }),
});
const hashPassword = (password) => bcrypt.hash(password, 12);
const comparePassword = (password, hash) => bcrypt.compare(password, hash);
// Middleware d'authentification
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Token requis" });
    if (revokedTokens.has(token))
        return res.status(403).json({ message: "Token révoqué" });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ message: "Token invalide" });
        req.user = user;
        next();
    });
};
// Error Handler
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
// ROUTES UTILISATEUR
app.post("/register", asyncHandler(async (req, res) => {
    const { username, email, password } = createUserSchema.parse(req.body);
    if (await userModel.findOne({ $or: [{ email }, { username }] })) {
        return res.status(400).json({ message: "Utilisateur existe déjà" });
    }
    const user = await userModel.create({
        username,
        email,
        password: await hashPassword(password),
    });
    const tokens = generateTokens({
        id: user._id,
        email: user.email,
        username: user.username,
        role: "user",
    });
    res.status(201).json({
        message: "Inscrit avec succès",
        data: { id: user._id, username: user.username, email: user.email },
        tokens,
    });
}));
app.post("/login", asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await userModel.findOne({ email }).select("+password");
    if (!user || !(await comparePassword(password, user.password))) {
        return res
            .status(401)
            .json({ message: "Email ou mot de passe invalide" });
    }
    const tokens = generateTokens({
        id: user._id,
        email: user.email,
        username: user.username,
        role: "user",
    });
    res.json({
        message: "Connecté",
        data: { id: user._id, username: user.username, email: user.email },
        tokens,
    });
}));
// ROUTES GROUPE
app.post("/group", authenticate, asyncHandler(async (req, res) => {
    const { name, description } = createGroupSchema.parse(req.body);
    const invitationCode = Math.random()
        .toString(36)
        .substring(7)
        .toUpperCase();
    const group = await groupModel.create({
        name,
        description,
        owner: req.user?.id,
        members: [req.user?.id],
        invitationCode,
    });
    res.status(201).json({
        message: "Groupe créé",
        data: group,
    });
}));
app.get("/group/:groupId", authenticate, asyncHandler(async (req, res) => {
    const group = await groupModel
        .findById(req.params.groupId)
        .populate("members", "username email");
    if (!group || !group.members.some((m) => m._id.equals(req.user?.id))) {
        return res.status(403).json({ message: "Accès refusé" });
    }
    res.json({ data: group });
}));
app.post("/group/join", authenticate, asyncHandler(async (req, res) => {
    const { invitationCode } = req.body;
    const group = await groupModel.findOne({ invitationCode });
    if (!group)
        return res.status(404).json({ message: "Groupe non trouvé" });
    if (group.members.includes(req.user?.id)) {
        return res.status(400).json({ message: "Déjà membre" });
    }
    group.members.push(req.user?.id);
    await group.save();
    res.json({ message: "Groupe rejoint", data: { groupId: group._id } });
}));
app.get("/groups", authenticate, asyncHandler(async (req, res) => {
    const groups = await groupModel
        .find({ members: req.user?.id })
        .populate("owner", "username");
    res.json({ data: groups });
}));
// ROUTES TÂCHE
app.post("/task", authenticate, asyncHandler(async (req, res) => {
    console.log("Req body reçu:", req.body);
    console.log("User:", req.user);
    const { title, description, deadline, groupId } = createTaskSchema.parse(req.body);
    console.log("Après validation Zod:", {
        title,
        description,
        deadline,
        groupId,
    });
    const group = await groupModel.findById(groupId);
    console.log("Groupe trouvé:", group);
    if (!group || !group.members.includes(req.user?.id)) {
        return res.status(403).json({ message: "Accès refusé" });
    }
    const taskData = {
        title,
        description: description || "",
        userId: req.user?.id,
        groupId,
        status: "pending", // CORRIGÉ: maintenant valide dans l'enum
    };
    if (deadline) {
        taskData.deadline = deadline;
    }
    console.log("Task data à créer:", taskData);
    const task = await taskModel.create(taskData);
    console.log("✅ Tâche créée:", task);
    res.status(201).json({ message: "Tâche créée", data: task });
}));
app.get("/task/:taskId", authenticate, asyncHandler(async (req, res) => {
    const task = await taskModel
        .findById(req.params.taskId)
        .populate("userId", "username");
    if (!task)
        return res.status(404).json({ message: "Tâche non trouvée" });
    const group = await groupModel.findById(task.groupId);
    if (!group?.members.includes(req.user?.id)) {
        return res.status(403).json({ message: "Accès refusé" });
    }
    res.json({ data: task });
}));
app.put("/task/:taskId", authenticate, asyncHandler(async (req, res) => {
    const task = await taskModel.findById(req.params.taskId);
    if (!task || !task.userId.equals(req.user?.id)) {
        return res.status(403).json({ message: "Accès refusé" });
    }
    const { title, description, status, deadline } = req.body;
    const updateData = { updatedAt: new Date() };
    if (title !== undefined)
        updateData.title = title;
    if (description !== undefined)
        updateData.description = description;
    if (status !== undefined)
        updateData.status = status;
    if (deadline !== undefined)
        updateData.deadline = deadline;
    const updatedTask = await taskModel.findByIdAndUpdate(req.params.taskId, updateData, { new: true, runValidators: true });
    res.json({ message: "Tâche mise à jour", data: updatedTask });
}));
app.delete("/task/:taskId", authenticate, asyncHandler(async (req, res) => {
    const task = await taskModel.findById(req.params.taskId);
    if (!task || !task.userId.equals(req.user?.id)) {
        return res.status(403).json({ message: "Accès refusé" });
    }
    await taskModel.deleteOne({ _id: req.params.taskId });
    res.json({ message: "Tâche supprimée" });
}));
app.get("/group/:groupId/tasks", authenticate, asyncHandler(async (req, res) => {
    const group = await groupModel.findById(req.params.groupId);
    if (!group?.members.includes(req.user?.id)) {
        return res.status(403).json({ message: "Accès refusé" });
    }
    const tasks = await taskModel
        .find({ groupId: req.params.groupId })
        .populate("userId", "username");
    res.json({ data: tasks });
}));
// ROUTES COMMUNES
app.post("/refresh-token", asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(401).json({ message: "Refresh token requis" });
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = decoded.role === "admin"
        ? await adminModel.findById(decoded.id)
        : await userModel.findById(decoded.id);
    if (!user)
        return res.status(403).json({ message: "Utilisateur non trouvé" });
    const username = "username" in user ? user.username : user.email;
    const tokens = generateTokens({
        id: user._id,
        email: user.email,
        username: username,
        role: decoded.role,
    });
    res.json(tokens);
}));
app.post("/logout", authenticate, (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (token)
        revokedTokens.add(token);
    res.json({ message: "Déconnecté" });
});
app.get("/profile", authenticate, asyncHandler(async (req, res) => {
    const user = req.user?.role === "admin"
        ? await adminModel.findById(req.user?.id)
        : await userModel.findById(req.user?.id);
    if (!user)
        return res.status(404).json({ message: "Utilisateur non trouvé" });
    const username = "username" in user ? user.username : user.email;
    res.json({
        data: {
            id: user._id,
            email: user.email,
            username: username,
            role: req.user?.role,
            createdAt: user.createdAt,
        },
    });
}));
// Error Handling
app.use((err, req, res, next) => {
    console.error(err);
    if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation erreur", errors: err });
    }
    if (err.name === "JsonWebTokenError") {
        return res.status(403).json({ message: "Token invalide" });
    }
    if (err.code === 11000) {
        return res.status(400).json({ message: "Doublon détecté" });
    }
    res.status(500).json({ message: "Erreur serveur", error: err.message });
});
app.listen(PORT, () => {
    console.log(`🚀 Serveur sur http://localhost:${PORT}`);
});
