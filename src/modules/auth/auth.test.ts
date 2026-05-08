import { describe, it, expect, vi, beforeEach } from "vitest";
import HttpError from "@/core/utils/httpError.js";

// ── Hoisted mock fns (must be declared via vi.hoisted so they are available
//    inside vi.mock factories, which are hoisted to the top of the file) ──────
const { mockFindFirst, mockSetEx, mockBcryptCompare, mockGenerateTokens } =
  vi.hoisted(() => ({
    mockFindFirst: vi.fn(),
    mockSetEx: vi.fn(),
    mockBcryptCompare: vi.fn(),
    mockGenerateTokens: vi.fn(),
  }));

// ── Module mocks ──────────────────────────────────────────────────────────────
vi.mock("@/core/config/drizzle.js", () => ({
  default: {
    query: {
      users: {
        findFirst: mockFindFirst,
      },
    },
  },
}));

vi.mock("@/core/config/redis.js", () => ({
  default: {
    setEx: mockSetEx,
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: mockBcryptCompare,
  },
}));

vi.mock("@/core/utils/generateTokens.js", () => ({
  default: mockGenerateTokens,
}));

// ── Subject under test ────────────────────────────────────────────────────────
import { authenticateUser } from "./auth.service.js";

// ── Fixtures ──────────────────────────────────────────────────────────────────
const MOCK_USER = {
  id: "user-uuid-1234",
  username: "testuser",
  password: "$2b$10$hashedpassword",
  role: "USER" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_TOKENS = {
  accessToken: "mock.access.token",
  refreshToken: "mock.refresh.token",
};

const SEVEN_DAYS = 60 * 60 * 24 * 7;

// ─────────────────────────────────────────────────────────────────────────────

describe("authenticateUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  it("returns access and refresh tokens on valid credentials", async () => {
    mockFindFirst.mockResolvedValue(MOCK_USER);
    mockBcryptCompare.mockResolvedValue(true);
    mockGenerateTokens.mockReturnValue(MOCK_TOKENS);
    mockSetEx.mockResolvedValue("OK");

    const result = await authenticateUser("testuser", "correct-password");

    expect(result).toEqual(MOCK_TOKENS);
  });

  it("queries the db for the user by username", async () => {
    mockFindFirst.mockResolvedValue(MOCK_USER);
    mockBcryptCompare.mockResolvedValue(true);
    mockGenerateTokens.mockReturnValue(MOCK_TOKENS);
    mockSetEx.mockResolvedValue("OK");

    await authenticateUser("testuser", "correct-password");

    expect(mockFindFirst).toHaveBeenCalledOnce();
  });

  it("compares the provided password against the stored hash", async () => {
    mockFindFirst.mockResolvedValue(MOCK_USER);
    mockBcryptCompare.mockResolvedValue(true);
    mockGenerateTokens.mockReturnValue(MOCK_TOKENS);
    mockSetEx.mockResolvedValue("OK");

    await authenticateUser("testuser", "correct-password");

    expect(mockBcryptCompare).toHaveBeenCalledOnce();
    expect(mockBcryptCompare).toHaveBeenCalledWith(
      "correct-password",
      MOCK_USER.password,
    );
  });

  it("stores the refresh token in redis with a 7-day TTL", async () => {
    mockFindFirst.mockResolvedValue(MOCK_USER);
    mockBcryptCompare.mockResolvedValue(true);
    mockGenerateTokens.mockReturnValue(MOCK_TOKENS);
    mockSetEx.mockResolvedValue("OK");

    await authenticateUser("testuser", "correct-password");

    expect(mockSetEx).toHaveBeenCalledOnce();
    expect(mockSetEx).toHaveBeenCalledWith(
      MOCK_TOKENS.refreshToken,
      SEVEN_DAYS,
      MOCK_USER.id,
    );
  });

  it("calls generateTokens with the correct user id and username", async () => {
    mockFindFirst.mockResolvedValue(MOCK_USER);
    mockBcryptCompare.mockResolvedValue(true);
    mockGenerateTokens.mockReturnValue(MOCK_TOKENS);
    mockSetEx.mockResolvedValue("OK");

    await authenticateUser("testuser", "correct-password");

    expect(mockGenerateTokens).toHaveBeenCalledOnce();
    expect(mockGenerateTokens).toHaveBeenCalledWith(
      MOCK_USER.id,
      MOCK_USER.username,
    );
  });

  // ── Error path: user not found ──────────────────────────────────────────────

  it("throws HttpError 401 when the user is not found", async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(
      authenticateUser("unknown-user", "any-password"),
    ).rejects.toThrow(HttpError);

    await expect(
      authenticateUser("unknown-user", "any-password"),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid username or password",
    });
  });

  it("does not call bcrypt.compare when the user is not found", async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(
      authenticateUser("unknown-user", "any-password"),
    ).rejects.toThrow(HttpError);

    expect(mockBcryptCompare).not.toHaveBeenCalled();
  });

  // ── Error path: wrong password ──────────────────────────────────────────────

  it("throws HttpError 401 when the password does not match", async () => {
    mockFindFirst.mockResolvedValue(MOCK_USER);
    mockBcryptCompare.mockResolvedValue(false);

    await expect(
      authenticateUser("testuser", "wrong-password"),
    ).rejects.toThrow(HttpError);

    await expect(
      authenticateUser("testuser", "wrong-password"),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid username or password",
    });
  });

  it("does not store a refresh token when credentials are invalid", async () => {
    mockFindFirst.mockResolvedValue(MOCK_USER);
    mockBcryptCompare.mockResolvedValue(false);

    await expect(
      authenticateUser("testuser", "wrong-password"),
    ).rejects.toThrow(HttpError);

    expect(mockSetEx).not.toHaveBeenCalled();
  });

  // ── Error path: db failure ──────────────────────────────────────────────────

  it("propagates db errors as-is", async () => {
    const dbError = new Error("Connection refused");
    mockFindFirst.mockRejectedValue(dbError);

    await expect(authenticateUser("testuser", "any-password")).rejects.toThrow(
      "Connection refused",
    );
  });

  // ── Error path: redis failure ───────────────────────────────────────────────

  it("propagates redis errors when setEx fails", async () => {
    mockFindFirst.mockResolvedValue(MOCK_USER);
    mockBcryptCompare.mockResolvedValue(true);
    mockGenerateTokens.mockReturnValue(MOCK_TOKENS);
    mockSetEx.mockRejectedValue(new Error("Redis unavailable"));

    await expect(
      authenticateUser("testuser", "correct-password"),
    ).rejects.toThrow("Redis unavailable");
  });
});
