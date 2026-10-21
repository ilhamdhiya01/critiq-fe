import "@testing-library/jest-dom/vitest";

import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// findBy*/waitFor default to 1s, which polling tests on real timers can miss
// when the whole suite runs in parallel.
configure({ asyncUtilTimeout: 3000 });

afterEach(() => {
  cleanup();
});
