import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import z from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
// Remplacer la configuration CORS actuelle par :
app.use(
  cors({
    origin: function (origin, callback) {
      // Autoriser toutes les origines en développement
      if (!origin) return callback(null, true);

      // Liste des origines autorisées - AJOUTEZ NETLIFY ICI !
      const allowedOrigins = [
        "http://localhost:5173", // Vite dev server
        "http://localhost:3000", // Create React App
        "http://localhost:8080", // Autres ports
        "https://tacheengroupe.netlify.app", // VOTRE FRONTEND SUR NETLIFY - AJOUTEZ CETTE LIGNE !
        "https://projet-nan-frontend.onrender.com", // Votre frontend sur Render
      ];

      // Autorisez aussi tous les sous-domaines Netlify
      if (
        allowedOrigins.includes(origin) || 
        origin.includes("onrender.com") || 
        origin.endsWith(".netlify.app") // AJOUTEZ CETTE LIGNE !
      ) {
        callback(null, true);
      } else {
        console.log("CORS bloqué pour l'origine:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
  })
);

// Ajoutez aussi cette ligne pour les requêtes OPTIONS (préflight)
app.options("*", cors());
app.use(express.json());

// Config BD
const url = process.env.MONGO_URL as string;

const connectdb = async (url: string) => {
  try {
    await mongoose.connect(url);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

connectdb(url);

// JWT Config
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "refresh_secret_key";
const revokedTokens = new Set<string>();

// Types
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: "user" | "admin";
  };
}

interface GroupRequest extends AuthRequest {
  group?: any;
}

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

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    default: null,
  },
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed"],
    default: "pending",
  },
  deadline: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const pointSchema = new mongoose.Schema({
  content: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
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
const pointModel = mongoose.model("Point", pointSchema);
const adminModel = mongoose.model("Admin", adminSchema);

// Validation Schemas
const createUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  deadline: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
});

const createGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const createPointSchema = z.object({
  content: z.string().min(1),
});

// Utility Functions
const generateTokens = (payload: any) => ({
  accessToken: jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" }),
  refreshToken: jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" }),
});

const hashPassword = (password: string) => bcrypt.hash(password, 12);
const comparePassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);

// Middleware d'authentification
const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token requis" });
  if (revokedTokens.has(token))
    return res.status(403).json({ message: "Token révoqué" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: "Token invalide" });
    req.user = user;
    next();
  });
};

// Middleware pour vérifier si l'utilisateur est propriétaire du groupe
const isGroupOwner = async (
  req: GroupRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const group = await groupModel.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Groupe non trouvé" });

    if (group.owner.toString() !== req.user?.id && req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Action réservée au propriétaire" });
    }

    req.group = group;
    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur serveur", error: (error as Error).message });
  }
};

// Middleware pour vérifier l'accès au groupe
const hasGroupAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const group = await groupModel.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Groupe non trouvé" });

    const isMember = group.members.some(
      (m: any) => m.toString() === req.user?.id
    );
    const isOwner = group.owner.toString() === req.user?.id;

    if (!isMember && !isOwner) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur serveur", error: (error as Error).message });
  }
};

// Error Handler
const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// ========== ROUTES UTILISATEUR ==========

app.post(
  "/register",
  asyncHandler(async (req: Request, res: Response) => {
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
      id: user._id.toString(), // Convertir en string
      email: user.email,
      username: user.username,
      role: "user",
    });

    res.status(201).json({
      message: "Inscrit avec succès",
      data: { id: user._id, username: user.username, email: user.email },
      tokens,
    });
  })
);

app.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await userModel.findOne({ email }).select("+password");

    if (!user || !(await comparePassword(password, user.password))) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe invalide" });
    }

    const tokens = generateTokens({
      id: user._id.toString(), // Convertir en string
      email: user.email,
      username: user.username,
      role: "user",
    });

    res.json({
      message: "Connecté",
      data: { id: user._id, username: user.username, email: user.email },
      tokens,
    });
  })
);

// ========== ROUTES GROUPE ==========

// Créer un groupe
app.post(
  "/group",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, description } = createGroupSchema.parse(req.body);
    const invitationCode = Math.random()
      .toString(36)
      .substring(2, 10)
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
  })
);

// Obtenir tous les groupes de l'utilisateur
app.get(
  "/groups",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const groups = await groupModel
      .find({ members: req.user?.id })
      .populate("owner", "username");
    res.json({ data: groups });
  })
);

// Obtenir un groupe
app.get(
  "/group/:groupId",
  authenticate,
  hasGroupAccess,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const group = await groupModel
      .findById(req.params.groupId)
      .populate("members", "username email");

    if (!group) {
      return res.status(404).json({ message: "Groupe non trouvé" });
    }

    res.json({ data: group });
  })
);

// Mettre à jour un groupe
app.put(
  "/group/:groupId",
  authenticate,
  isGroupOwner,
  asyncHandler(async (req: GroupRequest, res: Response) => {
    const { name, description } = updateGroupSchema.parse(req.body);

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const group = await groupModel.findByIdAndUpdate(
      req.params.groupId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ message: "Groupe mis à jour", data: group });
  })
);

// Supprimer un groupe
app.delete(
  "/group/:groupId",
  authenticate,
  isGroupOwner,
  asyncHandler(async (req: GroupRequest, res: Response) => {
    await taskModel.deleteMany({ groupId: req.params.groupId });
    await pointModel.deleteMany({ groupId: req.params.groupId });
    await groupModel.findByIdAndDelete(req.params.groupId);

    res.json({ message: "Groupe supprimé avec succès" });
  })
);

// Rejoindre un groupe
app.post(
  "/group/join",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { invitationCode } = req.body;
    const group = await groupModel.findOne({ invitationCode });

    if (!group) return res.status(404).json({ message: "Groupe non trouvé" });
    if (group.members.includes(req.user?.id as any)) {
      return res.status(400).json({ message: "Déjà membre" });
    }

    group.members.push(req.user?.id as any);
    await group.save();

    res.json({ message: "Groupe rejoint", data: { groupId: group._id } });
  })
);

// Obtenir les membres d'un groupe
app.get(
  "/group/:groupId/members",
  authenticate,
  hasGroupAccess,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const group = await groupModel
      .findById(req.params.groupId)
      .populate("members", "username email");

    if (!group) return res.status(404).json({ message: "Groupe non trouvé" });

    res.json({ data: group.members });
  })
);

// CORRIGÉ : Retirer un membre du groupe (propriétaire uniquement)
app.delete(
  "/group/:groupId/member/:memberId",
  authenticate,
  isGroupOwner,
  asyncHandler(async (req: GroupRequest, res: Response) => {
    try {
      const { groupId, memberId } = req.params;

      console.log("Suppression membre - Paramètres:", {
        groupId,
        memberId,
        userId: req.user?.id,
      });

      // Empêcher le propriétaire de se retirer lui-même
      if (req.user?.id === memberId) {
        return res
          .status(400)
          .json({
            message:
              "Le propriétaire ne peut pas se retirer. Supprimez le groupe à la place.",
          });
      }

      const group = await groupModel.findById(groupId);
      if (!group) return res.status(404).json({ message: "Groupe non trouvé" });

      console.log(
        "Groupe trouvé, membres:",
        group.members.map((m: any) => m.toString())
      );

      // Vérifier que le membre fait partie du groupe
      const memberObjectId = new mongoose.Types.ObjectId(memberId);
      const isMember = group.members.some((m: any) => {
        const memberStr = m.toString();
        const memberIdStr = memberId;
        const memberObjStr = memberObjectId.toString();

        console.log("Comparaison membre:", {
          memberStr,
          memberIdStr,
          memberObjStr,
          equals1: memberStr === memberIdStr,
          equals2: memberStr === memberObjStr,
        });

        return memberStr === memberIdStr || memberStr === memberObjStr;
      });

      if (!isMember) {
        return res.status(404).json({
          message: "Membre non trouvé dans ce groupe",
          details: {
            memberId,
            groupMembers: group.members.map((m: any) => m.toString()),
          },
        });
      }

      // Retirer le membre - méthode simple
      group.members = group.members.filter((m: any) => {
        const memberStr = m.toString();
        return (
          memberStr !== memberId && memberStr !== memberObjectId.toString()
        );
      });

      await group.save();

      // Supprimer les tâches du membre dans ce groupe
      await taskModel.deleteMany({
        userId: memberObjectId, // Utiliser ObjectId ici
        groupId: groupId,
      });

      // Récupérer le groupe mis à jour avec les membres populés
      const updatedGroup = await groupModel
        .findById(groupId)
        .populate("owner", "username")
        .populate("members", "username email");

      console.log("Membre retiré avec succès");
      res.json({
        message: "Membre retiré avec succès",
        data: updatedGroup,
      });
    } catch (error: any) {
      console.error("Erreur lors de la suppression du membre:", error);
      res.status(500).json({
        message: "Erreur serveur",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  })
);

// ========== ROUTES TÂCHE ==========

// Créer une tâche (avec ou sans groupe)
app.post(
  "/task",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, description, deadline, groupId } = createTaskSchema.parse(
      req.body
    );

    // Si un groupId est fourni, vérifier l'accès
    if (groupId) {
      const group = await groupModel.findById(groupId);
      if (!group || !group.members.includes(req.user?.id as any)) {
        return res.status(403).json({ message: "Accès refusé au groupe" });
      }
    }

    const taskData: any = {
      title,
      description: description || "",
      userId: req.user?.id,
      groupId: groupId || null,
      status: "pending",
    };

    if (deadline) {
      taskData.deadline = new Date(deadline);
    }

    const task = await taskModel.create(taskData);

    res.status(201).json({ message: "Tâche créée", data: task });
  })
);

// Obtenir toutes les tâches de l'utilisateur (personnelles + groupes)
app.get(
  "/tasks",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tasks = await taskModel
      .find({ userId: req.user?.id })
      .populate("groupId", "name")
      .populate("userId", "username");
    res.json({ data: tasks });
  })
);

// Obtenir les tâches personnelles (sans groupe)
app.get(
  "/tasks/personal",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tasks = await taskModel
      .find({ userId: req.user?.id, groupId: null })
      .populate("userId", "username");
    res.json({ data: tasks });
  })
);

// Obtenir les tâches d'un groupe
app.get(
  "/group/:groupId/tasks",
  authenticate,
  hasGroupAccess,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const tasks = await taskModel
      .find({ groupId: req.params.groupId })
      .populate("userId", "username");
    res.json({ data: tasks });
  })
);

// Obtenir une tâche
app.get(
  "/task/:taskId",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const task = await taskModel
      .findById(req.params.taskId)
      .populate("userId", "username");

    if (!task) return res.status(404).json({ message: "Tâche non trouvée" });

    // Vérifier l'accès
    if (task.groupId) {
      const group = await groupModel.findById(task.groupId);
      if (!group?.members.includes(req.user?.id as any)) {
        return res.status(403).json({ message: "Accès refusé" });
      }
    } else {
      // Tâche personnelle
      if (!task.userId.equals(req.user?.id)) {
        return res.status(403).json({ message: "Accès refusé" });
      }
    }

    res.json({ data: task });
  })
);

// Mettre à jour une tâche
app.put(
  "/task/:taskId",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const task = await taskModel.findById(req.params.taskId);

    if (!task || !task.userId.equals(req.user?.id)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const { title, description, status, deadline } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (deadline !== undefined) updateData.deadline = deadline;

    const updatedTask = await taskModel.findByIdAndUpdate(
      req.params.taskId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ message: "Tâche mise à jour", data: updatedTask });
  })
);

// Supprimer une tâche
app.delete(
  "/task/:taskId",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const task = await taskModel.findById(req.params.taskId);

    if (!task || !task.userId.equals(req.user?.id)) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    await taskModel.deleteOne({ _id: req.params.taskId });
    res.json({ message: "Tâche supprimée" });
  })
);

// ========== ROUTES POINTS ==========

// Ajouter un point à un groupe
app.post(
  "/group/:groupId/point",
  authenticate,
  hasGroupAccess,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { content } = createPointSchema.parse(req.body);

    const point = await pointModel.create({
      content,
      userId: req.user?.id,
      groupId: req.params.groupId,
    });

    const populatedPoint = await pointModel
      .findById(point._id)
      .populate("userId", "username");

    res.status(201).json({ message: "Point ajouté", data: populatedPoint });
  })
);

// Obtenir les points d'un groupe
app.get(
  "/group/:groupId/points",
  authenticate,
  hasGroupAccess,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const points = await pointModel
      .find({ groupId: req.params.groupId })
      .populate("userId", "username")
      .sort({ createdAt: -1 });
    res.json({ data: points });
  })
);

// ========== ROUTES COMMUNES ==========

app.post(
  "/refresh-token",
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ message: "Refresh token requis" });

    const decoded: any = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user =
      decoded.role === "admin"
        ? await adminModel.findById(decoded.id)
        : await userModel.findById(decoded.id);

    if (!user)
      return res.status(403).json({ message: "Utilisateur non trouvé" });

    const username = "username" in user ? user.username : user.email;

    const tokens = generateTokens({
      id: user._id.toString(), // Convertir en string
      email: user.email,
      username: username,
      role: decoded.role,
    });

    res.json(tokens);
  })
);

app.post("/logout", authenticate, (req: AuthRequest, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) revokedTokens.add(token);
  res.json({ message: "Déconnecté" });
});

app.get(
  "/profile",
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user =
      req.user?.role === "admin"
        ? await adminModel.findById(req.user?.id)
        : await userModel.findById(req.user?.id);

    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé" });

    const username = "username" in user ? user.username : user.email;

    res.json({
      data: {
        id: user._id.toString(), // Convertir en string
        email: user.email,
        username: username,
        role: req.user?.role,
        createdAt: user.createdAt,
      },
    });
  })
);

// Error Handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Erreur globale:", err);

  if (err instanceof z.ZodError) {
    return res.status(400).json({ message: "Validation erreur" });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(403).json({ message: "Token invalide" });
  }

  if (err.code === 11000) {
    return res.status(400).json({ message: "Doublon détecté" });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "ID invalide" });
  }

  res.status(500).json({ message: "Erreur serveur", error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur sur http://localhost:${PORT}`);
});
