import { assert, describe, it } from "vitest";
import {
  assertValidProjectPath,
  isAbsolutePath,
  isInlangProjectPath,
} from "./validateProjectPath.js";

describe("isAbsolutePath", () => {
  it("should correctly identify Unix absolute paths", () => {
    assert.isTrue(isAbsolutePath("/home/user/documents/file.txt"));
    assert.isTrue(isAbsolutePath("/usr/local/bin/script.sh"));
    assert.isFalse(isAbsolutePath("relative/path/to/file.txt"));
  });

  it("should correctly identify Windows absolute paths", () => {
    assert.isTrue(isAbsolutePath("C:\\Users\\User\\Documents\\File.txt"));
    assert.isTrue(isAbsolutePath("C:/Users/user/project.inlang/settings.json"));
    assert.isFalse(isAbsolutePath("Projects\\Project1\\source\\file.txt"));
  });

  it("should handle edge cases", () => {
    assert.isFalse(isAbsolutePath("")); // Empty path should return false
    assert.isFalse(isAbsolutePath("relative/path/../file.txt")); // Relative path with ".." should return false
    assert.isFalse(isAbsolutePath("../relative/path/to/file.txt"));
    assert.isFalse(isAbsolutePath("./relative/path/to/file.txt"));
  });
});

describe("isInlangProjectPath", () => {
  it("should correctly identify valid inlang project paths", () => {
    assert.isTrue(isInlangProjectPath("/path/to/orange-mouse.inlang"));
    assert.isFalse(isInlangProjectPath("relative/path/to/file.txt"));
    assert.isFalse(isInlangProjectPath("/path/to/.inlang"));
    assert.isFalse(isInlangProjectPath("/path/to/white-elephant.inlang/"));
    assert.isFalse(
      isInlangProjectPath("/path/to/blue-elephant.inlang/settings.json"),
    );
  });
});

describe("assertValidProjectPath", () => {
  it("should not throw for valid project paths", () => {
    assert.doesNotThrow(() =>
      assertValidProjectPath("/path/to/brown-mouse.inlang"),
    );
    assert.doesNotThrow(() =>
      assertValidProjectPath("/path/to/green-elephant.inlang"),
    );
  });

  it("should throw for invalid project paths", () => {
    assert.throws(() =>
      assertValidProjectPath("relative/path/to/flying-lizard.inlang"),
    );
    assert.throws(() => assertValidProjectPath("/path/to/loud-mouse.inlang/"));
    assert.throws(() =>
      assertValidProjectPath("/path/to/green-elephant.inlang/settings.json"),
    );
  });
});
