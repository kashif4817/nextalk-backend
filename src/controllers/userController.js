import asyncHandler from "../utils/asyncHandler";
import { sendResponse } from "../utils/sendResponse";
import { prisma } from "../lib/prisma";

const searchUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;

  if (!query) return sendResponse(res, 400, "No query provided");
  const user = await prisma.profile.findMany({
    where: { 
        username:{
            contains: search,
            mode: "insensitive"
        },
     },
  });

  if (user.length === 0) return sendResponse(res, 404, "User not found");
  return sendResponse(res, 200, "User found", user);
});



const getUserProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await prisma.profile.findUnique({
        where: { id: userId },
    }); 
    if (!user) return sendResponse(res, 404, "User not found");
    return sendResponse(res, 200, "User found", user);      
    

});




