import { Router,Request,Response } from "express";
import z from "zod";

export const routerUser = Router();

const createUserSchema = z.object({
    username: z
    .string({ error: "Name is required" })
    .min(3, "Name must be at least 3 characters long"),

})


routerUser.post("/createUser",async(req:Request,res:Response)=>{
const valideData = createUserSchema.parse(req.body);
const {username} = valideData;
res.status(201).json({message:`User ${username} created successfully`})

})