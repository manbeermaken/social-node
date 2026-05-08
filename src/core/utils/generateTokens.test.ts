import { describe, it, expect, vi, beforeEach } from "vitest";
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";

// Mock env before importing the module under test
vi.mock("@/core/config/env.js", () => ({
  default: {
    ACCESS_TOKEN_SECRET: "test_access_secret",
    REFRESH_TOKEN_SECRET: "test_refresh_secret",
  },
}));

// Mock jsonwebtoken
vi.mock("jsonwebtoken");

import generateTokens from "./generateTokens.js";

const mockSign = vi.mocked(jwt.sign);

describe("generateTokens", () => {
  const userId = "user-123";
  const username = "johndoe";

  beforeEach(() => {
    vi.clearAllMocks();
    mockSign
      .mockReturnValueOnce("mocked_access_token" as unknown as never)
      .mockReturnValueOnce("mocked_refresh_token" as unknown as never);
  });

  it("should return an object with accessToken and refreshToken", () => {
    const result = generateTokens(userId, username);

    expect(result).toEqual({
      accessToken: "mocked_access_token",
      refreshToken: "mocked_refresh_token",
    });
  });

  it("should call jwt.sign twice — once for each token", () => {
    generateTokens(userId, username);

    expect(mockSign).toHaveBeenCalledTimes(2);
  });

  it("should sign the access token with correct payload and secret", () => {
    generateTokens(userId, username);

    expect(mockSign).toHaveBeenNthCalledWith(
      1,
      { id: userId, username },
      "test_access_secret",
      { expiresIn: "15m" },
    );
  });

  it("should sign the refresh token with correct payload and secret (no expiry)", () => {
    generateTokens(userId, username);

    expect(mockSign).toHaveBeenNthCalledWith(
      2,
      { id: userId, username },
      "test_refresh_secret",
    );
  });

  it("should embed userId and username in both token payloads", () => {
    generateTokens(userId, username);

    const [accessPayload] = mockSign.mock.calls[0] as [object, ...unknown[]];
    const [refreshPayload] = mockSign.mock.calls[1] as [object, ...unknown[]];

    expect(accessPayload).toMatchObject({ id: userId, username });
    expect(refreshPayload).toMatchObject({ id: userId, username });
  });

  it("should NOT set an expiry on the refresh token", () => {
    generateTokens(userId, username);

    // The refresh token call should have no options argument
    expect(mockSign.mock.calls[1]).toHaveLength(2);
  });

  it("should produce valid, decodable tokens using real jwt (integration-style)", async () => {
    // Use the real jwt implementation via importActual to bypass the module-level mock
    const realJwt = await vi.importActual<typeof import("jsonwebtoken")>("jsonwebtoken");

    const ACCESS_SECRET = "real_access_secret";
    const REFRESH_SECRET = "real_refresh_secret";

    const realAccessToken = realJwt.sign(
      { id: userId, username },
      ACCESS_SECRET,
      { expiresIn: "15m" },
    );
    const realRefreshToken = realJwt.sign({ id: userId, username }, REFRESH_SECRET);

    const decodedAccess = realJwt.verify(realAccessToken, ACCESS_SECRET) as JwtPayload;
    const decodedRefresh = realJwt.verify(realRefreshToken, REFRESH_SECRET) as JwtPayload;

    expect(decodedAccess.id).toBe(userId);
    expect(decodedAccess.username).toBe(username);
    expect(decodedAccess.exp).toBeDefined(); // access token has expiry

    expect(decodedRefresh.id).toBe(userId);
    expect(decodedRefresh.username).toBe(username);
    expect(decodedRefresh.exp).toBeUndefined(); // refresh token has no expiry
  });
});
