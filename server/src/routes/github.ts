import { Router } from "express";
import { getContributions, GithubError } from "../services/githubService.js";
export const githubRouter = Router();
githubRouter.get("/:username/contributions", async (req, res) => {
  const username = req.params.username;
  const year = Number(req.query.year);
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username)) {
    res.status(400).json({
      error:
        "Enter a valid GitHub username (up to 39 letters, numbers, or hyphens).",
    });
    return;
  }
  if (
    typeof req.query.year !== "string" ||
    !/^\d{4}$/.test(req.query.year) ||
    !Number.isInteger(year) ||
    year < 2008 ||
    year > new Date().getUTCFullYear()
  ) {
    res
      .status(400)
      .json({ error: "Choose a year from 2008 through the current year." });
    return;
  }
  try {
    res.json(await getContributions(username, year));
  } catch (error) {
    res.status(error instanceof GithubError ? error.status : 500).json({
      error:
        error instanceof GithubError
          ? error.message
          : "Unable to build this city. Please try again.",
    });
  }
});
