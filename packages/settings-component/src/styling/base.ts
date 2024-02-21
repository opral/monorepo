import { css } from "lit"

export const baseStyling = css`
	:host {
		/*
   * Color Primitives
   */

		/* Gray */
		--inlang-color-gray-50: hsl(0 0% 97.5%);
		--inlang-color-gray-100: hsl(240 4.8% 95.9%);
		--inlang-color-gray-200: hsl(240 5.9% 90%);
		--inlang-color-gray-300: hsl(240 4.9% 83.9%);
		--inlang-color-gray-400: hsl(240 5% 64.9%);
		--inlang-color-gray-500: hsl(240 3.8% 46.1%);
		--inlang-color-gray-600: hsl(240 5.2% 33.9%);
		--inlang-color-gray-700: hsl(240 5.3% 26.1%);
		--inlang-color-gray-800: hsl(240 3.7% 15.9%);
		--inlang-color-gray-900: hsl(240 5.9% 10%);
		--inlang-color-gray-950: hsl(240 7.3% 8%);

		/* Red */
		--inlang-color-red-50: hsl(0 85.7% 97.3%);
		--inlang-color-red-100: hsl(0 93.3% 94.1%);
		--inlang-color-red-200: hsl(0 96.3% 89.4%);
		--inlang-color-red-300: hsl(0 93.5% 81.8%);
		--inlang-color-red-400: hsl(0 90.6% 70.8%);
		--inlang-color-red-500: hsl(0 84.2% 60.2%);
		--inlang-color-red-600: hsl(0 72.2% 50.6%);
		--inlang-color-red-700: hsl(0 73.7% 41.8%);
		--inlang-color-red-800: hsl(0 70% 35.3%);
		--inlang-color-red-900: hsl(0 62.8% 30.6%);
		--inlang-color-red-950: hsl(0 60% 19.6%);

		/* Orange */
		--inlang-color-orange-50: hsl(33.3 100% 96.5%);
		--inlang-color-orange-100: hsl(34.3 100% 91.8%);
		--inlang-color-orange-200: hsl(32.1 97.7% 83.1%);
		--inlang-color-orange-300: hsl(30.7 97.2% 72.4%);
		--inlang-color-orange-400: hsl(27 96% 61%);
		--inlang-color-orange-500: hsl(24.6 95% 53.1%);
		--inlang-color-orange-600: hsl(20.5 90.2% 48.2%);
		--inlang-color-orange-700: hsl(17.5 88.3% 40.4%);
		--inlang-color-orange-800: hsl(15 79.1% 33.7%);
		--inlang-color-orange-900: hsl(15.3 74.6% 27.8%);
		--inlang-color-orange-950: hsl(15.2 69.1% 19%);

		/* Amber */
		--inlang-color-amber-50: hsl(48 100% 96.1%);
		--inlang-color-amber-100: hsl(48 96.5% 88.8%);
		--inlang-color-amber-200: hsl(48 96.6% 76.7%);
		--inlang-color-amber-300: hsl(45.9 96.7% 64.5%);
		--inlang-color-amber-400: hsl(43.3 96.4% 56.3%);
		--inlang-color-amber-500: hsl(37.7 92.1% 50.2%);
		--inlang-color-amber-600: hsl(32.1 94.6% 43.7%);
		--inlang-color-amber-700: hsl(26 90.5% 37.1%);
		--inlang-color-amber-800: hsl(22.7 82.5% 31.4%);
		--inlang-color-amber-900: hsl(21.7 77.8% 26.5%);
		--inlang-color-amber-950: hsl(22.9 74.1% 16.7%);

		/* Yellow */
		--inlang-color-yellow-50: hsl(54.5 91.7% 95.3%);
		--inlang-color-yellow-100: hsl(54.9 96.7% 88%);
		--inlang-color-yellow-200: hsl(52.8 98.3% 76.9%);
		--inlang-color-yellow-300: hsl(50.4 97.8% 63.5%);
		--inlang-color-yellow-400: hsl(47.9 95.8% 53.1%);
		--inlang-color-yellow-500: hsl(45.4 93.4% 47.5%);
		--inlang-color-yellow-600: hsl(40.6 96.1% 40.4%);
		--inlang-color-yellow-700: hsl(35.5 91.7% 32.9%);
		--inlang-color-yellow-800: hsl(31.8 81% 28.8%);
		--inlang-color-yellow-900: hsl(28.4 72.5% 25.7%);
		--inlang-color-yellow-950: hsl(33.1 69% 13.9%);

		/* Lime */
		--inlang-color-lime-50: hsl(78.3 92% 95.1%);
		--inlang-color-lime-100: hsl(79.6 89.1% 89.2%);
		--inlang-color-lime-200: hsl(80.9 88.5% 79.6%);
		--inlang-color-lime-300: hsl(82 84.5% 67.1%);
		--inlang-color-lime-400: hsl(82.7 78% 55.5%);
		--inlang-color-lime-500: hsl(83.7 80.5% 44.3%);
		--inlang-color-lime-600: hsl(84.8 85.2% 34.5%);
		--inlang-color-lime-700: hsl(85.9 78.4% 27.3%);
		--inlang-color-lime-800: hsl(86.3 69% 22.7%);
		--inlang-color-lime-900: hsl(87.6 61.2% 20.2%);
		--inlang-color-lime-950: hsl(86.5 60.6% 13.9%);

		/* Green */
		--inlang-color-green-50: hsl(138.5 76.5% 96.7%);
		--inlang-color-green-100: hsl(140.6 84.2% 92.5%);
		--inlang-color-green-200: hsl(141 78.9% 85.1%);
		--inlang-color-green-300: hsl(141.7 76.6% 73.1%);
		--inlang-color-green-400: hsl(141.9 69.2% 58%);
		--inlang-color-green-500: hsl(142.1 70.6% 45.3%);
		--inlang-color-green-600: hsl(142.1 76.2% 36.3%);
		--inlang-color-green-700: hsl(142.4 71.8% 29.2%);
		--inlang-color-green-800: hsl(142.8 64.2% 24.1%);
		--inlang-color-green-900: hsl(143.8 61.2% 20.2%);
		--inlang-color-green-950: hsl(144.3 60.7% 12%);

		/* Emerald */
		--inlang-color-emerald-50: hsl(151.8 81% 95.9%);
		--inlang-color-emerald-100: hsl(149.3 80.4% 90%);
		--inlang-color-emerald-200: hsl(152.4 76% 80.4%);
		--inlang-color-emerald-300: hsl(156.2 71.6% 66.9%);
		--inlang-color-emerald-400: hsl(158.1 64.4% 51.6%);
		--inlang-color-emerald-500: hsl(160.1 84.1% 39.4%);
		--inlang-color-emerald-600: hsl(161.4 93.5% 30.4%);
		--inlang-color-emerald-700: hsl(162.9 93.5% 24.3%);
		--inlang-color-emerald-800: hsl(163.1 88.1% 19.8%);
		--inlang-color-emerald-900: hsl(164.2 85.7% 16.5%);
		--inlang-color-emerald-950: hsl(164.3 87.5% 9.4%);

		/* Teal */
		--inlang-color-teal-50: hsl(166.2 76.5% 96.7%);
		--inlang-color-teal-100: hsl(167.2 85.5% 89.2%);
		--inlang-color-teal-200: hsl(168.4 83.8% 78.2%);
		--inlang-color-teal-300: hsl(170.6 76.9% 64.3%);
		--inlang-color-teal-400: hsl(172.5 66% 50.4%);
		--inlang-color-teal-500: hsl(173.4 80.4% 40%);
		--inlang-color-teal-600: hsl(174.7 83.9% 31.6%);
		--inlang-color-teal-700: hsl(175.3 77.4% 26.1%);
		--inlang-color-teal-800: hsl(176.1 69.4% 21.8%);
		--inlang-color-teal-900: hsl(175.9 60.8% 19%);
		--inlang-color-teal-950: hsl(176.5 58.6% 11.4%);

		/* Cyan */
		--inlang-color-cyan-50: hsl(183.2 100% 96.3%);
		--inlang-color-cyan-100: hsl(185.1 95.9% 90.4%);
		--inlang-color-cyan-200: hsl(186.2 93.5% 81.8%);
		--inlang-color-cyan-300: hsl(187 92.4% 69%);
		--inlang-color-cyan-400: hsl(187.9 85.7% 53.3%);
		--inlang-color-cyan-500: hsl(188.7 94.5% 42.7%);
		--inlang-color-cyan-600: hsl(191.6 91.4% 36.5%);
		--inlang-color-cyan-700: hsl(192.9 82.3% 31%);
		--inlang-color-cyan-800: hsl(194.4 69.6% 27.1%);
		--inlang-color-cyan-900: hsl(196.4 63.6% 23.7%);
		--inlang-color-cyan-950: hsl(196.8 61% 16.1%);

		/* Sky */
		--inlang-color-sky-50: hsl(204 100% 97.1%);
		--inlang-color-sky-100: hsl(204 93.8% 93.7%);
		--inlang-color-sky-200: hsl(200.6 94.4% 86.1%);
		--inlang-color-sky-300: hsl(199.4 95.5% 73.9%);
		--inlang-color-sky-400: hsl(198.4 93.2% 59.6%);
		--inlang-color-sky-500: hsl(198.6 88.7% 48.4%);
		--inlang-color-sky-600: hsl(200.4 98% 39.4%);
		--inlang-color-sky-700: hsl(201.3 96.3% 32.2%);
		--inlang-color-sky-800: hsl(201 90% 27.5%);
		--inlang-color-sky-900: hsl(202 80.3% 23.9%);
		--inlang-color-sky-950: hsl(202.3 73.8% 16.5%);

		/* Blue */
		--inlang-color-blue-50: hsl(213.8 100% 96.9%);
		--inlang-color-blue-100: hsl(214.3 94.6% 92.7%);
		--inlang-color-blue-200: hsl(213.3 96.9% 87.3%);
		--inlang-color-blue-300: hsl(211.7 96.4% 78.4%);
		--inlang-color-blue-400: hsl(213.1 93.9% 67.8%);
		--inlang-color-blue-500: hsl(217.2 91.2% 59.8%);
		--inlang-color-blue-600: hsl(221.2 83.2% 53.3%);
		--inlang-color-blue-700: hsl(224.3 76.3% 48%);
		--inlang-color-blue-800: hsl(225.9 70.7% 40.2%);
		--inlang-color-blue-900: hsl(224.4 64.3% 32.9%);
		--inlang-color-blue-950: hsl(226.2 55.3% 18.4%);

		/* Indigo */
		--inlang-color-indigo-50: hsl(225.9 100% 96.7%);
		--inlang-color-indigo-100: hsl(226.5 100% 93.9%);
		--inlang-color-indigo-200: hsl(228 96.5% 88.8%);
		--inlang-color-indigo-300: hsl(229.7 93.5% 81.8%);
		--inlang-color-indigo-400: hsl(234.5 89.5% 73.9%);
		--inlang-color-indigo-500: hsl(238.7 83.5% 66.7%);
		--inlang-color-indigo-600: hsl(243.4 75.4% 58.6%);
		--inlang-color-indigo-700: hsl(244.5 57.9% 50.6%);
		--inlang-color-indigo-800: hsl(243.7 54.5% 41.4%);
		--inlang-color-indigo-900: hsl(242.2 47.4% 34.3%);
		--inlang-color-indigo-950: hsl(243.5 43.6% 22.9%);

		/* Violet */
		--inlang-color-violet-50: hsl(250 100% 97.6%);
		--inlang-color-violet-100: hsl(251.4 91.3% 95.5%);
		--inlang-color-violet-200: hsl(250.5 95.2% 91.8%);
		--inlang-color-violet-300: hsl(252.5 94.7% 85.1%);
		--inlang-color-violet-400: hsl(255.1 91.7% 76.3%);
		--inlang-color-violet-500: hsl(258.3 89.5% 66.3%);
		--inlang-color-violet-600: hsl(262.1 83.3% 57.8%);
		--inlang-color-violet-700: hsl(263.4 70% 50.4%);
		--inlang-color-violet-800: hsl(263.4 69.3% 42.2%);
		--inlang-color-violet-900: hsl(263.5 67.4% 34.9%);
		--inlang-color-violet-950: hsl(265.1 61.5% 21.4%);

		/* Purple */
		--inlang-color-purple-50: hsl(270 100% 98%);
		--inlang-color-purple-100: hsl(268.7 100% 95.5%);
		--inlang-color-purple-200: hsl(268.6 100% 91.8%);
		--inlang-color-purple-300: hsl(269.2 97.4% 85.1%);
		--inlang-color-purple-400: hsl(270 95.2% 75.3%);
		--inlang-color-purple-500: hsl(270.7 91% 65.1%);
		--inlang-color-purple-600: hsl(271.5 81.3% 55.9%);
		--inlang-color-purple-700: hsl(272.1 71.7% 47.1%);
		--inlang-color-purple-800: hsl(272.9 67.2% 39.4%);
		--inlang-color-purple-900: hsl(273.6 65.6% 32%);
		--inlang-color-purple-950: hsl(276 59.5% 16.5%);

		/* Fuchsia */
		--inlang-color-fuchsia-50: hsl(289.1 100% 97.8%);
		--inlang-color-fuchsia-100: hsl(287 100% 95.5%);
		--inlang-color-fuchsia-200: hsl(288.3 95.8% 90.6%);
		--inlang-color-fuchsia-300: hsl(291.1 93.1% 82.9%);
		--inlang-color-fuchsia-400: hsl(292 91.4% 72.5%);
		--inlang-color-fuchsia-500: hsl(292.2 84.1% 60.6%);
		--inlang-color-fuchsia-600: hsl(293.4 69.5% 48.8%);
		--inlang-color-fuchsia-700: hsl(294.7 72.4% 39.8%);
		--inlang-color-fuchsia-800: hsl(295.4 70.2% 32.9%);
		--inlang-color-fuchsia-900: hsl(296.7 63.6% 28%);
		--inlang-color-fuchsia-950: hsl(297.1 56.8% 14.5%);

		/* Pink */
		--inlang-color-pink-50: hsl(327.3 73.3% 97.1%);
		--inlang-color-pink-100: hsl(325.7 77.8% 94.7%);
		--inlang-color-pink-200: hsl(325.9 84.6% 89.8%);
		--inlang-color-pink-300: hsl(327.4 87.1% 81.8%);
		--inlang-color-pink-400: hsl(328.6 85.5% 70.2%);
		--inlang-color-pink-500: hsl(330.4 81.2% 60.4%);
		--inlang-color-pink-600: hsl(333.3 71.4% 50.6%);
		--inlang-color-pink-700: hsl(335.1 77.6% 42%);
		--inlang-color-pink-800: hsl(335.8 74.4% 35.3%);
		--inlang-color-pink-900: hsl(335.9 69% 30.4%);
		--inlang-color-pink-950: hsl(336.2 65.4% 15.9%);

		/* Rose */
		--inlang-color-rose-50: hsl(355.7 100% 97.3%);
		--inlang-color-rose-100: hsl(355.6 100% 94.7%);
		--inlang-color-rose-200: hsl(352.7 96.1% 90%);
		--inlang-color-rose-300: hsl(352.6 95.7% 81.8%);
		--inlang-color-rose-400: hsl(351.3 94.5% 71.4%);
		--inlang-color-rose-500: hsl(349.7 89.2% 60.2%);
		--inlang-color-rose-600: hsl(346.8 77.2% 49.8%);
		--inlang-color-rose-700: hsl(345.3 82.7% 40.8%);
		--inlang-color-rose-800: hsl(343.4 79.7% 34.7%);
		--inlang-color-rose-900: hsl(341.5 75.5% 30.4%);
		--inlang-color-rose-950: hsl(341.3 70.1% 17.1%);

		/*
   * Theme Tokens
   */

		/* Primary */
		--inlang-color-primary-50: var(--inlang-color-sky-50);
		--inlang-color-primary-100: var(--inlang-color-sky-100);
		--inlang-color-primary-200: var(--inlang-color-sky-200);
		--inlang-color-primary-300: var(--inlang-color-sky-300);
		--inlang-color-primary-400: var(--inlang-color-sky-400);
		--inlang-color-primary-500: var(--inlang-color-sky-500);
		--inlang-color-primary-600: var(--inlang-color-sky-600);
		--inlang-color-primary-700: var(--inlang-color-sky-700);
		--inlang-color-primary-800: var(--inlang-color-sky-800);
		--inlang-color-primary-900: var(--inlang-color-sky-900);
		--inlang-color-primary-950: var(--inlang-color-sky-950);

		/* Success */
		--inlang-color-success-50: var(--inlang-color-green-50);
		--inlang-color-success-100: var(--inlang-color-green-100);
		--inlang-color-success-200: var(--inlang-color-green-200);
		--inlang-color-success-300: var(--inlang-color-green-300);
		--inlang-color-success-400: var(--inlang-color-green-400);
		--inlang-color-success-500: var(--inlang-color-green-500);
		--inlang-color-success-600: var(--inlang-color-green-600);
		--inlang-color-success-700: var(--inlang-color-green-700);
		--inlang-color-success-800: var(--inlang-color-green-800);
		--inlang-color-success-900: var(--inlang-color-green-900);
		--inlang-color-success-950: var(--inlang-color-green-950);

		/* Warning */
		--inlang-color-warning-50: var(--inlang-color-amber-50);
		--inlang-color-warning-100: var(--inlang-color-amber-100);
		--inlang-color-warning-200: var(--inlang-color-amber-200);
		--inlang-color-warning-300: var(--inlang-color-amber-300);
		--inlang-color-warning-400: var(--inlang-color-amber-400);
		--inlang-color-warning-500: var(--inlang-color-amber-500);
		--inlang-color-warning-600: var(--inlang-color-amber-600);
		--inlang-color-warning-700: var(--inlang-color-amber-700);
		--inlang-color-warning-800: var(--inlang-color-amber-800);
		--inlang-color-warning-900: var(--inlang-color-amber-900);
		--inlang-color-warning-950: var(--inlang-color-amber-950);

		/* Danger */
		--inlang-color-danger-50: var(--inlang-color-red-50);
		--inlang-color-danger-100: var(--inlang-color-red-100);
		--inlang-color-danger-200: var(--inlang-color-red-200);
		--inlang-color-danger-300: var(--inlang-color-red-300);
		--inlang-color-danger-400: var(--inlang-color-red-400);
		--inlang-color-danger-500: var(--inlang-color-red-500);
		--inlang-color-danger-600: var(--inlang-color-red-600);
		--inlang-color-danger-700: var(--inlang-color-red-700);
		--inlang-color-danger-800: var(--inlang-color-red-800);
		--inlang-color-danger-900: var(--inlang-color-red-900);
		--inlang-color-danger-950: var(--inlang-color-red-950);

		/* Neutral */
		--inlang-color-neutral-50: var(--inlang-color-gray-50);
		--inlang-color-neutral-100: var(--inlang-color-gray-100);
		--inlang-color-neutral-200: var(--inlang-color-gray-200);
		--inlang-color-neutral-300: var(--inlang-color-gray-300);
		--inlang-color-neutral-400: var(--inlang-color-gray-400);
		--inlang-color-neutral-500: var(--inlang-color-gray-500);
		--inlang-color-neutral-600: var(--inlang-color-gray-600);
		--inlang-color-neutral-700: var(--inlang-color-gray-700);
		--inlang-color-neutral-800: var(--inlang-color-gray-800);
		--inlang-color-neutral-900: var(--inlang-color-gray-900);
		--inlang-color-neutral-950: var(--inlang-color-gray-950);

		/* Neutral one-offs */
		--inlang-color-neutral-0: hsl(0, 0%, 100%);
		--inlang-color-neutral-1000: hsl(0, 0%, 0%);

		/*
   * Border radii
   */

		--inlang-border-radius-small: 0.1875rem; /* 3px */
		--inlang-border-radius-medium: 0.25rem; /* 4px */
		--inlang-border-radius-large: 0.5rem; /* 8px */
		--inlang-border-radius-x-large: 1rem; /* 16px */

		--inlang-border-radius-circle: 50%;
		--inlang-border-radius-pill: 9999px;

		/*
   * Elevations
   */

		--inlang-shadow-x-small: 0 1px 2px hsl(240 3.8% 46.1% / 6%);
		--inlang-shadow-small: 0 1px 2px hsl(240 3.8% 46.1% / 12%);
		--inlang-shadow-medium: 0 2px 4px hsl(240 3.8% 46.1% / 12%);
		--inlang-shadow-large: 0 2px 8px hsl(240 3.8% 46.1% / 12%);
		--inlang-shadow-x-large: 0 4px 16px hsl(240 3.8% 46.1% / 12%);

		/*
   * Spacings
   */

		--inlang-spacing-3x-small: 0.125rem; /* 2px */
		--inlang-spacing-2x-small: 0.25rem; /* 4px */
		--inlang-spacing-x-small: 0.5rem; /* 8px */
		--inlang-spacing-small: 0.75rem; /* 12px */
		--inlang-spacing-medium: 1rem; /* 16px */
		--inlang-spacing-large: 1.25rem; /* 20px */
		--inlang-spacing-x-large: 1.75rem; /* 28px */
		--inlang-spacing-2x-large: 2.25rem; /* 36px */
		--inlang-spacing-3x-large: 3rem; /* 48px */
		--inlang-spacing-4x-large: 4.5rem; /* 72px */

		/*
   * Transitions
   */

		--inlang-transition-x-slow: 1000ms;
		--inlang-transition-slow: 500ms;
		--inlang-transition-medium: 250ms;
		--inlang-transition-fast: 150ms;
		--inlang-transition-x-fast: 50ms;

		/*
   * Typography
   */

		/* Fonts */
		--inlang-font-mono: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
		--inlang-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
			sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
		--inlang-font-serif: Georgia, "Times New Roman", serif;

		/* Font sizes */
		--inlang-font-size-2x-small: 0.625rem; /* 10px */
		--inlang-font-size-x-small: 0.75rem; /* 12px */
		--inlang-font-size-small: 0.875rem; /* 14px */
		--inlang-font-size-medium: 1rem; /* 16px */
		--inlang-font-size-large: 1.25rem; /* 20px */
		--inlang-font-size-x-large: 1.5rem; /* 24px */
		--inlang-font-size-2x-large: 2.25rem; /* 36px */
		--inlang-font-size-3x-large: 3rem; /* 48px */
		--inlang-font-size-4x-large: 4.5rem; /* 72px */

		/* Font weights */
		--inlang-font-weight-light: 300;
		--inlang-font-weight-normal: 400;
		--inlang-font-weight-semibold: 500;
		--inlang-font-weight-bold: 700;

		/* Letter spacings */
		--inlang-letter-spacing-denser: -0.03em;
		--inlang-letter-spacing-dense: -0.015em;
		--inlang-letter-spacing-normal: normal;
		--inlang-letter-spacing-loose: 0.075em;
		--inlang-letter-spacing-looser: 0.15em;

		/* Line heights */
		--inlang-line-height-denser: 1;
		--inlang-line-height-dense: 1.4;
		--inlang-line-height-normal: 1.8;
		--inlang-line-height-loose: 2.2;
		--inlang-line-height-looser: 2.6;

		/* Focus rings */
		--inlang-focus-ring-color: var(--inlang-color-primary-600);
		--inlang-focus-ring-style: solid;
		--inlang-focus-ring-width: 3px;
		--inlang-focus-ring: var(--inlang-focus-ring-style) var(--inlang-focus-ring-width)
			var(--inlang-focus-ring-color);
		--inlang-focus-ring-offset: 1px;

		/*
   * Forms
   */

		/* Buttons */
		--inlang-button-font-size-small: var(--inlang-font-size-x-small);
		--inlang-button-font-size-medium: var(--inlang-font-size-small);
		--inlang-button-font-size-large: var(--inlang-font-size-medium);

		/* Inputs */
		--inlang-input-height-small: 1.875rem; /* 30px */
		--inlang-input-height-medium: 2.5rem; /* 40px */
		--inlang-input-height-large: 3.125rem; /* 50px */

		--inlang-input-background-color: var(--inlang-color-neutral-0);
		--inlang-input-background-color-hover: var(--inlang-input-background-color);
		--inlang-input-background-color-focus: var(--inlang-input-background-color);
		--inlang-input-background-color-disabled: var(--inlang-color-neutral-100);
		--inlang-input-border-color: var(--inlang-color-neutral-300);
		--inlang-input-border-color-hover: var(--inlang-color-neutral-400);
		--inlang-input-border-color-focus: var(--inlang-color-primary-500);
		--inlang-input-border-color-disabled: var(--inlang-color-neutral-300);
		--inlang-input-border-width: 1px;
		--inlang-input-required-content: "*";
		--inlang-input-required-content-offset: -2px;
		--inlang-input-required-content-color: var(--inlang-input-label-color);

		--inlang-input-border-radius-small: var(--inlang-border-radius-medium);
		--inlang-input-border-radius-medium: var(--inlang-border-radius-medium);
		--inlang-input-border-radius-large: var(--inlang-border-radius-medium);

		--inlang-input-font-family: var(--inlang-font-sans);
		--inlang-input-font-weight: var(--inlang-font-weight-normal);
		--inlang-input-font-size-small: var(--inlang-font-size-small);
		--inlang-input-font-size-medium: var(--inlang-font-size-medium);
		--inlang-input-font-size-large: var(--inlang-font-size-large);
		--inlang-input-letter-spacing: var(--inlang-letter-spacing-normal);

		--inlang-input-color: var(--inlang-color-neutral-700);
		--inlang-input-color-hover: var(--inlang-color-neutral-700);
		--inlang-input-color-focus: var(--inlang-color-neutral-700);
		--inlang-input-color-disabled: var(--inlang-color-neutral-900);
		--inlang-input-icon-color: var(--inlang-color-neutral-500);
		--inlang-input-icon-color-hover: var(--inlang-color-neutral-600);
		--inlang-input-icon-color-focus: var(--inlang-color-neutral-600);
		--inlang-input-placeholder-color: var(--inlang-color-neutral-500);
		--inlang-input-placeholder-color-disabled: var(--inlang-color-neutral-600);
		--inlang-input-spacing-small: var(--inlang-spacing-small);
		--inlang-input-spacing-medium: var(--inlang-spacing-medium);
		--inlang-input-spacing-large: var(--inlang-spacing-large);

		--inlang-input-focus-ring-color: hsl(198.6 88.7% 48.4% / 40%);
		--inlang-input-focus-ring-offset: 0;

		--inlang-input-filled-background-color: var(--inlang-color-neutral-100);
		--inlang-input-filled-background-color-hover: var(--inlang-color-neutral-100);
		--inlang-input-filled-background-color-focus: var(--inlang-color-neutral-100);
		--inlang-input-filled-background-color-disabled: var(--inlang-color-neutral-100);
		--inlang-input-filled-color: var(--inlang-color-neutral-800);
		--inlang-input-filled-color-hover: var(--inlang-color-neutral-800);
		--inlang-input-filled-color-focus: var(--inlang-color-neutral-700);
		--inlang-input-filled-color-disabled: var(--inlang-color-neutral-800);

		/* Labels */
		--inlang-input-label-font-size-small: var(--inlang-font-size-small);
		--inlang-input-label-font-size-medium: var(--inlang-font-size-medium);
		--inlang-input-label-font-size-large: var(--inlang-font-size-large);
		--inlang-input-label-color: inherit;

		/* Help text */
		--inlang-input-help-text-font-size-small: var(--inlang-font-size-x-small);
		--inlang-input-help-text-font-size-medium: var(--inlang-font-size-small);
		--inlang-input-help-text-font-size-large: var(--inlang-font-size-medium);
		--inlang-input-help-text-color: var(--inlang-color-neutral-500);

		/* Toggles (checkboxes, radios, switches) */
		--inlang-toggle-size-small: 0.875rem; /* 14px */
		--inlang-toggle-size-medium: 1.125rem; /* 18px */
		--inlang-toggle-size-large: 1.375rem; /* 22px */

		/*
   * Overlays
   */

		--inlang-overlay-background-color: hsl(240 3.8% 46.1% / 33%);

		/*
   * Panels
   */

		--inlang-panel-background-color: var(--inlang-color-neutral-0);
		--inlang-panel-border-color: var(--inlang-color-neutral-200);
		--inlang-panel-border-width: 1px;

		/*
   * Tooltips
   */

		--inlang-tooltip-border-radius: var(--inlang-border-radius-medium);
		--inlang-tooltip-background-color: var(--inlang-color-neutral-800);
		--inlang-tooltip-color: var(--inlang-color-neutral-0);
		--inlang-tooltip-font-family: var(--inlang-font-sans);
		--inlang-tooltip-font-weight: var(--inlang-font-weight-normal);
		--inlang-tooltip-font-size: var(--inlang-font-size-small);
		--inlang-tooltip-line-height: var(--inlang-line-height-dense);
		--inlang-tooltip-padding: var(--inlang-spacing-2x-small) var(--inlang-spacing-x-small);
		--inlang-tooltip-arrow-size: 6px;

		/*
   * Z-indexes
   */

		--inlang-z-index-drawer: 700;
		--inlang-z-index-dialog: 800;
		--inlang-z-index-dropdown: 900;
		--inlang-z-index-toast: 950;
		--inlang-z-index-tooltip: 1000;

		/*
  * Wrapp the showlace theme ----------------------------------------
  */

		/*
   * Color Primitives
   */

		/* Gray */
		--sl-color-gray-50: var(--inlang-color-gray-50);
		--sl-color-gray-100: var(--inlang-color-gray-100);
		--sl-color-gray-200: var(--inlang-color-gray-200);
		--sl-color-gray-300: var(--inlang-color-gray-300);
		--sl-color-gray-400: var(--inlang-color-gray-400);
		--sl-color-gray-500: var(--inlang-color-gray-500);
		--sl-color-gray-600: var(--inlang-color-gray-600);
		--sl-color-gray-700: var(--inlang-color-gray-700);
		--sl-color-gray-800: var(--inlang-color-gray-800);
		--sl-color-gray-900: var(--inlang-color-gray-900);
		--sl-color-gray-950: var(--inlang-color-gray-950);

		/* Red */
		--sl-color-red-50: var(--inlang-color-red-50);
		--sl-color-red-100: var(--inlang-color-red-100);
		--sl-color-red-200: var(--inlang-color-red-200);
		--sl-color-red-300: var(--inlang-color-red-300);
		--sl-color-red-400: var(--inlang-color-red-400);
		--sl-color-red-500: var(--inlang-color-red-500);
		--sl-color-red-600: var(--inlang-color-red-600);
		--sl-color-red-700: var(--inlang-color-red-700);
		--sl-color-red-800: var(--inlang-color-red-800);
		--sl-color-red-900: var(--inlang-color-red-900);
		--sl-color-red-950: var(--inlang-color-red-950);

		/* Amber */
		--sl-color-amber-50: var(--inlang-color-amber-50);
		--sl-color-amber-100: var(--inlang-color-amber-100);
		--sl-color-amber-200: var(--inlang-color-amber-200);
		--sl-color-amber-300: var(--inlang-color-amber-300);
		--sl-color-amber-400: var(--inlang-color-amber-400);
		--sl-color-amber-500: var(--inlang-color-amber-500);
		--sl-color-amber-600: var(--inlang-color-amber-600);
		--sl-color-amber-700: var(--inlang-color-amber-700);
		--sl-color-amber-800: var(--inlang-color-amber-800);
		--sl-color-amber-900: var(--inlang-color-amber-900);
		--sl-color-amber-950: var(--inlang-color-amber-950);

		/* Lime */
		--sl-color-lime-50: var(--inlang-color-lime-50);
		--sl-color-lime-100: var(--inlang-color-lime-100);
		--sl-color-lime-200: var(--inlang-color-lime-200);
		--sl-color-lime-300: var(--inlang-color-lime-300);
		--sl-color-lime-400: var(--inlang-color-lime-400);
		--sl-color-lime-500: var(--inlang-color-lime-500);
		--sl-color-lime-600: var(--inlang-color-lime-600);
		--sl-color-lime-700: var(--inlang-color-lime-700);
		--sl-color-lime-800: var(--inlang-color-lime-800);
		--sl-color-lime-900: var(--inlang-color-lime-900);
		--sl-color-lime-950: var(--inlang-color-lime-950);

		/* Green */
		--sl-color-green-50: var(--inlang-color-green-50);
		--sl-color-green-100: var(--inlang-color-green-100);
		--sl-color-green-200: var(--inlang-color-green-200);
		--sl-color-green-300: var(--inlang-color-green-300);
		--sl-color-green-400: var(--inlang-color-green-400);
		--sl-color-green-500: var(--inlang-color-green-500);
		--sl-color-green-600: var(--inlang-color-green-600);
		--sl-color-green-700: var(--inlang-color-green-700);
		--sl-color-green-800: var(--inlang-color-green-800);
		--sl-color-green-900: var(--inlang-color-green-900);
		--sl-color-green-950: var(--inlang-color-green-950);

		/* Emerald */
		--sl-color-emerald-50: var(--inlang-color-emerald-50);
		--sl-color-emerald-100: var(--inlang-color-emerald-100);
		--sl-color-emerald-200: var(--inlang-color-emerald-200);
		--sl-color-emerald-300: var(--inlang-color-emerald-300);
		--sl-color-emerald-400: var(--inlang-color-emerald-400);
		--sl-color-emerald-500: var(--inlang-color-emerald-500);
		--sl-color-emerald-600: var(--inlang-color-emerald-600);
		--sl-color-emerald-700: var(--inlang-color-emerald-700);
		--sl-color-emerald-800: var(--inlang-color-emerald-800);
		--sl-color-emerald-900: var(--inlang-color-emerald-900);
		--sl-color-emerald-950: var(--inlang-color-emerald-950);

		/* Teal */
		--sl-color-teal-50: var(--inlang-color-teal-50);
		--sl-color-teal-100: var(--inlang-color-teal-100);
		--sl-color-teal-200: var(--inlang-color-teal-200);
		--sl-color-teal-300: var(--inlang-color-teal-300);
		--sl-color-teal-400: var(--inlang-color-teal-400);
		--sl-color-teal-500: var(--inlang-color-teal-500);
		--sl-color-teal-600: var(--inlang-color-teal-600);
		--sl-color-teal-700: var(--inlang-color-teal-700);
		--sl-color-teal-800: var(--inlang-color-teal-800);
		--sl-color-teal-900: var(--inlang-color-teal-900);
		--sl-color-teal-950: var(--inlang-color-teal-950);

		/* Cyan */
		--sl-color-cyan-50: var(--inlang-color-cyan-50);
		--sl-color-cyan-100: var(--inlang-color-cyan-100);
		--sl-color-cyan-200: var(--inlang-color-cyan-200);
		--sl-color-cyan-300: var(--inlang-color-cyan-300);
		--sl-color-cyan-400: var(--inlang-color-cyan-400);
		--sl-color-cyan-500: var(--inlang-color-cyan-500);
		--sl-color-cyan-600: var(--inlang-color-cyan-600);
		--sl-color-cyan-700: var(--inlang-color-cyan-700);
		--sl-color-cyan-800: var(--inlang-color-cyan-800);
		--sl-color-cyan-900: var(--inlang-color-cyan-900);
		--sl-color-cyan-950: var(--inlang-color-cyan-950);

		/* Sky */
		--sl-color-sky-50: var(--inlang-color-sky-50);
		--sl-color-sky-100: var(--inlang-color-sky-100);
		--sl-color-sky-200: var(--inlang-color-sky-200);
		--sl-color-sky-300: var(--inlang-color-sky-300);
		--sl-color-sky-400: var(--inlang-color-sky-400);
		--sl-color-sky-500: var(--inlang-color-sky-500);
		--sl-color-sky-600: var(--inlang-color-sky-600);
		--sl-color-sky-700: var(--inlang-color-sky-700);
		--sl-color-sky-800: var(--inlang-color-sky-800);
		--sl-color-sky-900: var(--inlang-color-sky-900);
		--sl-color-sky-950: var(--inlang-color-sky-950);

		/* Blue */
		--sl-color-blue-50: var(--inlang-color-blue-50);
		--sl-color-blue-100: var(--inlang-color-blue-100);
		--sl-color-blue-200: var(--inlang-color-blue-200);
		--sl-color-blue-300: var(--inlang-color-blue-300);
		--sl-color-blue-400: var(--inlang-color-blue-400);
		--sl-color-blue-500: var(--inlang-color-blue-500);
		--sl-color-blue-600: var(--inlang-color-blue-600);
		--sl-color-blue-700: var(--inlang-color-blue-700);
		--sl-color-blue-800: var(--inlang-color-blue-800);
		--sl-color-blue-900: var(--inlang-color-blue-900);
		--sl-color-blue-950: var(--inlang-color-blue-950);

		/* Indigo */
		--sl-color-indigo-50: var(--inlang-color-indigo-50);
		--sl-color-indigo-100: var(--inlang-color-indigo-100);
		--sl-color-indigo-200: var(--inlang-color-indigo-200);
		--sl-color-indigo-300: var(--inlang-color-indigo-300);
		--sl-color-indigo-400: var(--inlang-color-indigo-400);
		--sl-color-indigo-500: var(--inlang-color-indigo-500);
		--sl-color-indigo-600: var(--inlang-color-indigo-600);
		--sl-color-indigo-700: var(--inlang-color-indigo-700);
		--sl-color-indigo-800: var(--inlang-color-indigo-800);
		--sl-color-indigo-900: var(--inlang-color-indigo-900);
		--sl-color-indigo-950: var(--inlang-color-indigo-950);

		/* Violet */
		--sl-color-violet-50: var(--inlang-color-violet-50);
		--sl-color-violet-100: var(--inlang-color-violet-100);
		--sl-color-violet-200: var(--inlang-color-violet-200);
		--sl-color-violet-300: var(--inlang-color-violet-300);
		--sl-color-violet-400: var(--inlang-color-violet-400);
		--sl-color-violet-500: var(--inlang-color-violet-500);
		--sl-color-violet-600: var(--inlang-color-violet-600);
		--sl-color-violet-700: var(--inlang-color-violet-700);
		--sl-color-violet-800: var(--inlang-color-violet-800);
		--sl-color-violet-900: var(--inlang-color-violet-900);
		--sl-color-violet-950: var(--inlang-color-violet-950);

		/* Purple */
		--sl-color-purple-50: var(--inlang-color-purple-50);
		--sl-color-purple-100: var(--inlang-color-purple-100);
		--sl-color-purple-200: var(--inlang-color-purple-200);
		--sl-color-purple-300: var(--inlang-color-purple-300);
		--sl-color-purple-400: var(--inlang-color-purple-400);
		--sl-color-purple-500: var(--inlang-color-purple-500);
		--sl-color-purple-600: var(--inlang-color-purple-600);
		--sl-color-purple-700: var(--inlang-color-purple-700);
		--sl-color-purple-800: var(--inlang-color-purple-800);
		--sl-color-purple-900: var(--inlang-color-purple-900);
		--sl-color-purple-950: var(--inlang-color-purple-950);

		/* Fuchsia */
		--sl-color-fuchsia-50: var(--inlang-color-fuchsia-50);
		--sl-color-fuchsia-100: var(--inlang-color-fuchsia-100);
		--sl-color-fuchsia-200: var(--inlang-color-fuchsia-200);
		--sl-color-fuchsia-300: var(--inlang-color-fuchsia-300);
		--sl-color-fuchsia-400: var(--inlang-color-fuchsia-400);
		--sl-color-fuchsia-500: var(--inlang-color-fuchsia-500);
		--sl-color-fuchsia-600: var(--inlang-color-fuchsia-600);
		--sl-color-fuchsia-700: var(--inlang-color-fuchsia-700);
		--sl-color-fuchsia-800: var(--inlang-color-fuchsia-800);
		--sl-color-fuchsia-900: var(--inlang-color-fuchsia-900);
		--sl-color-fuchsia-950: var(--inlang-color-fuchsia-950);

		/* Pink */
		--sl-color-pink-50: var(--inlang-color-pink-50);
		--sl-color-pink-100: var(--inlang-color-pink-100);
		--sl-color-pink-200: var(--inlang-color-pink-200);
		--sl-color-pink-300: var(--inlang-color-pink-300);
		--sl-color-pink-400: var(--inlang-color-pink-400);
		--sl-color-pink-500: var(--inlang-color-pink-500);
		--sl-color-pink-600: var(--inlang-color-pink-600);
		--sl-color-pink-700: var(--inlang-color-pink-700);
		--sl-color-pink-800: var(--inlang-color-pink-800);
		--sl-color-pink-900: var(--inlang-color-pink-900);
		--sl-color-pink-950: var(--inlang-color-pink-950);

		/* Rose */
		--sl-color-rose-50: var(--inlang-color-rose-50);
		--sl-color-rose-100: var(--inlang-color-rose-100);
		--sl-color-rose-200: var(--inlang-color-rose-200);
		--sl-color-rose-300: var(--inlang-color-rose-300);
		--sl-color-rose-400: var(--inlang-color-rose-400);
		--sl-color-rose-500: var(--inlang-color-rose-500);
		--sl-color-rose-600: var(--inlang-color-rose-600);
		--sl-color-rose-700: var(--inlang-color-rose-700);
		--sl-color-rose-800: var(--inlang-color-rose-800);
		--sl-color-rose-900: var(--inlang-color-rose-900);
		--sl-color-rose-950: var(--inlang-color-rose-950);

		/*
   * Theme Tokens
   */

		/* Primary */
		--sl-color-primary-50: var(--inlang-color-primary-50);
		--sl-color-primary-100: var(--inlang-color-primary-100);
		--sl-color-primary-200: var(--inlang-color-primary-200);
		--sl-color-primary-300: var(--inlang-color-primary-300);
		--sl-color-primary-400: var(--inlang-color-primary-400);
		--sl-color-primary-500: var(--inlang-color-primary-500);
		--sl-color-primary-600: var(--inlang-color-primary-600);
		--sl-color-primary-700: var(--inlang-color-primary-700);
		--sl-color-primary-800: var(--inlang-color-primary-800);
		--sl-color-primary-900: var(--inlang-color-primary-900);
		--sl-color-primary-950: var(--inlang-color-primary-950);

		/* Success */
		--sl-color-success-50: var(--inlang-color-success-50);
		--sl-color-success-100: var(--inlang-color-success-100);
		--sl-color-success-200: var(--inlang-color-success-200);
		--sl-color-success-300: var(--inlang-color-success-300);
		--sl-color-success-400: var(--inlang-color-success-400);
		--sl-color-success-500: var(--inlang-color-success-500);
		--sl-color-success-600: var(--inlang-color-success-600);
		--sl-color-success-700: var(--inlang-color-success-700);
		--sl-color-success-800: var(--inlang-color-success-800);
		--sl-color-success-900: var(--inlang-color-success-900);
		--sl-color-success-950: var(--inlang-color-success-950);

		/* Warning */
		--sl-color-warning-50: var(--inlang-color-warning-50);
		--sl-color-warning-100: var(--inlang-color-warning-100);
		--sl-color-warning-200: var(--inlang-color-warning-200);
		--sl-color-warning-300: var(--inlang-color-warning-300);
		--sl-color-warning-400: var(--inlang-color-warning-400);
		--sl-color-warning-500: var(--inlang-color-warning-500);
		--sl-color-warning-600: var(--inlang-color-warning-600);
		--sl-color-warning-700: var(--inlang-color-warning-700);
		--sl-color-warning-800: var(--inlang-color-warning-800);
		--sl-color-warning-900: var(--inlang-color-warning-900);
		--sl-color-warning-950: var(--inlang-color-warning-950);

		/* Danger */
		--sl-color-danger-50: var(--inlang-color-danger-50);
		--sl-color-danger-100: var(--inlang-color-danger-100);
		--sl-color-danger-200: var(--inlang-color-danger-200);
		--sl-color-danger-300: var(--inlang-color-danger-300);
		--sl-color-danger-400: var(--inlang-color-danger-400);
		--sl-color-danger-500: var(--inlang-color-danger-500);
		--sl-color-danger-600: var(--inlang-color-danger-600);
		--sl-color-danger-700: var(--inlang-color-danger-700);
		--sl-color-danger-800: var(--inlang-color-danger-800);
		--sl-color-danger-900: var(--inlang-color-danger-900);
		--sl-color-danger-950: var(--inlang-color-danger-950);

		/* Neutral */
		--sl-color-neutral-50: var(--inlang-color-neutral-50);
		--sl-color-neutral-100: var(--inlang-color-neutral-100);
		--sl-color-neutral-200: var(--inlang-color-neutral-200);
		--sl-color-neutral-300: var(--inlang-color-neutral-300);
		--sl-color-neutral-400: var(--inlang-color-neutral-400);
		--sl-color-neutral-500: var(--inlang-color-neutral-500);
		--sl-color-neutral-600: var(--inlang-color-neutral-600);
		--sl-color-neutral-700: var(--inlang-color-neutral-700);
		--sl-color-neutral-800: var(--inlang-color-neutral-800);
		--sl-color-neutral-900: var(--inlang-color-neutral-900);
		--sl-color-neutral-950: var(--inlang-color-neutral-950);

		/* Neutral one-offs */
		--sl-color-neutral-0: var(--inlang-color-neutral-0);
		--sl-color-neutral-1000: var(--inlang-color-neutral-1000);

		/*
   * Border radii
   */

		--sl-border-radius-small: var(--inlang-border-radius-small);
		--sl-border-radius-medium: var(--inlang-border-radius-medium);
		--sl-border-radius-large: var(--inlang-border-radius-large);
		--sl-border-radius-x-large: var(--inlang-border-radius-x-large);

		--sl-border-radius-circle: var(--inlang-border-radius-circle);
		--sl-border-radius-pill: var(--inlang-border-radius-pill);

		/*
   * Elevations
   */

		--sl-shadow-x-small: var(--inlang-shadow-x-small);
		--sl-shadow-small: var(--inlang-shadow-small);
		--sl-shadow-medium: var(--inlang-shadow-medium);
		--sl-shadow-large: var(--inlang-shadow-large);
		--sl-shadow-x-large: var(--inlang-shadow-x-large);

		/*
   * Spacings
   */

		--sl-spacing-3x-small: var(--inlang-spacing-3x-small);
		--sl-spacing-2x-small: var(--inlang-spacing-2x-small);
		--sl-spacing-x-small: var(--inlang-spacing-x-small);
		--sl-spacing-small: var(--inlang-spacing-small);
		--sl-spacing-medium: var(--inlang-spacing-medium);
		--sl-spacing-large: var(--inlang-spacing-large);
		--sl-spacing-x-large: var(--inlang-spacing-x-large);
		--sl-spacing-2x-large: var(--inlang-spacing-2x-large);
		--sl-spacing-3x-large: var(--inlang-spacing-3x-large);
		--sl-spacing-4x-large: var(--inlang-spacing-4x-large);

		/*
   * Typography
   */

		/* Fonts */
		--sl-font-mono: var(--inlang-font-mono);
		--sl-font-sans: var(--inlang-font-sans);
		--sl-font-serif: var(--inlang-font-serif);

		/* Font sizes */
		--sl-font-size-2x-small: var(--inlang-font-size-2x-small);
		--sl-font-size-x-small: var(--inlang-font-size-x-small);
		--sl-font-size-small: var(--inlang-font-size-small);
		--sl-font-size-medium: var(--inlang-font-size-medium);
		--sl-font-size-large: var(--inlang-font-size-large);
		--sl-font-size-x-large: var(--inlang-font-size-x-large);
		--sl-font-size-2x-large: var(--inlang-font-size-2x-large);
		--sl-font-size-3x-large: var(--inlang-font-size-3x-large);
		--sl-font-size-4x-large: var(--inlang-font-size-4x-large);

		/* Font weights */
		--sl-font-weight-light: var(--inlang-font-weight-light);
		--sl-font-weight-normal: var(--inlang-font-weight-normal);
		--sl-font-weight-semibold: var(--inlang-font-weight-semibold);
		--sl-font-weight-bold: var(--inlang-font-weight-bold);

		/* Letter spacings */
		--sl-letter-spacing-denser: var(--inlang-letter-spacing-denser);
		--sl-letter-spacing-dense: var(--inlang-letter-spacing-dense);
		--sl-letter-spacing-normal: var(--inlang-letter-spacing-normal);
		--sl-letter-spacing-loose: var(--inlang-letter-spacing-loose);
		--sl-letter-spacing-looser: var(--inlang-letter-spacing-looser);

		/* Line heights */
		--sl-line-height-denser: var(--inlang-line-height-denser);
		--sl-line-height-dense: var(--inlang-line-height-dense);
		--sl-line-height-normal: var(--inlang-line-height-normal);
		--sl-line-height-loose: var(--inlang-line-height-loose);
		--sl-line-height-looser: var(--inlang-line-height-looser);

		/* Focus rings */
		--sl-focus-ring-color: var(--inlang-focus-ring-color);
		--sl-focus-ring-style: var(--inlang-focus-ring-style);
		--sl-focus-ring-width: var(--inlang-focus-ring-width);
		--sl-focus-ring: var(--inlang-focus-ring);
		--sl-focus-ring-offset: var(--inlang-focus-ring-offset);

		/*
   * Forms
   */

		/* Buttons */
		--sl-button-font-size-small: var(--inlang-button-font-size-small);
		--sl-button-font-size-medium: var(--inlang-button-font-size-medium);
		--sl-button-font-size-large: var(--inlang-button-font-size-large);

		/* Inputs */
		--sl-input-height-small: var(--inlang-input-height-small);
		--sl-input-height-medium: var(--inlang-input-height-medium);
		--sl-input-height-large: var(--inlang-input-height-large);

		--sl-input-background-color: var(--inlang-input-background-color);
		--sl-input-background-color-hover: var(--inlang-input-background-color-hover);
		--sl-input-background-color-focus: var(--inlang-input-background-color-focus);
		--sl-input-background-color-disabled: var(--inlang-input-background-color-disabled);
		--sl-input-border-color: var(--inlang-input-border-color);
		--sl-input-border-color-hover: var(--inlang-input-border-color-hover);

		--sl-input-border-color-focus: var(--inlang-input-border-color-focus);
		--sl-input-border-color-disabled: var(--inlang-input-border-color-disabled);
		--sl-input-border-width: var(--inlang-input-border-width);
		--sl-input-required-content: var(--inlang-input-required-content);

		--sl-input-border-radius-small: var(--inlang-input-border-radius-small);
		--sl-input-border-radius-medium: var(--inlang-input-border-radius-medium);
		--sl-input-border-radius-large: var(--inlang-input-border-radius-large);

		--sl-input-font-family: var(--inlang-input-font-family);
		--sl-input-font-weight: var(--inlang-input-font-weight);
		--sl-input-font-size-small: var(--inlang-input-font-size-small);
		--sl-input-font-size-medium: var(--inlang-input-font-size-medium);
		--sl-input-font-size-large: var(--inlang-input-font-size-large);
		--sl-input-letter-spacing: var(--inlang-input-letter-spacing);

		--sl-input-color: var(--inlang-input-color);
		--sl-input-color-hover: var(--inlang-input-color-hover);
		--sl-input-color-focus: var(--inlang-input-color-focus);
		--sl-input-color-disabled: var(--inlang-input-color-disabled);
		--sl-input-icon-color: var(--inlang-input-icon-color);
		--sl-input-icon-color-hover: var(--inlang-input-icon-color-hover);
		--sl-input-icon-color-focus: var(--inlang-input-icon-color-focus);
		--sl-input-placeholder-color: var(--inlang-input-placeholder-color);
		--sl-input-placeholder-color-disabled: var(--inlang-input-placeholder-color-disabled);
		--sl-input-spacing-small: var(--inlang-input-spacing-small);
		--sl-input-spacing-medium: var(--inlang-input-spacing-medium);
		--sl-input-spacing-large: var(--inlang-input-spacing-large);

		--sl-input-focus-ring-color: var(--inlang-input-focus-ring-color);
		--sl-input-focus-ring-offset: var(--inlang-input-focus-ring-offset);

		--sl-input-filled-background-color: var(--inlang-input-filled-background-color);
		--sl-input-filled-background-color-hover: var(--inlang-input-filled-background-color-hover);
		--sl-input-filled-background-color-focus: var(--inlang-input-filled-background-color-focus);
		--sl-input-filled-background-color-disabled: var(
			--inlang-input-filled-background-color-disabled
		);
		--sl-input-filled-color: var(--inlang-input-filled-color);
		--sl-input-filled-color-hover: var(--inlang-input-filled-color-hover);
		--sl-input-filled-color-focus: var(--inlang-input-filled-color-focus);
		--sl-input-filled-color-disabled: var(--inlang-input-filled-color-disabled);

		/* Labels */
		--sl-input-label-font-size-small: var(--inlang-input-label-font-size-small);
		--sl-input-label-font-size-medium: var(--inlang-input-label-font-size-medium);
		--sl-input-label-font-size-large: var(--inlang-input-label-font-size-large);
		--sl-input-label-color: var(--inlang-input-label-color);

		/* Help text */
		--sl-input-help-text-font-size-small: var(--inlang-input-help-text-font-size-small);
		--sl-input-help-text-font-size-medium: var(--inlang-input-help-text-font-size-medium);
		--sl-input-help-text-font-size-large: var(--inlang-input-help-text-font-size-large);
		--sl-input-help-text-color: var(--inlang-input-help-text-color);

		/* Toggles (checkboxes, radios, switches) */
		--sl-toggle-size-small: var(--inlang-toggle-size-small);
		--sl-toggle-size-medium: var(--inlang-toggle-size-medium);
		--sl-toggle-size-large: var(--inlang-toggle-size-large);

		/*
   * Overlays
   */

		--sl-overlay-background-color: var(--inlang-overlay-background-color);

		/*
   * Panels
   */

		--sl-panel-background-color: var(--inlang-panel-background-color);
		--sl-panel-border-color: var(--inlang-panel-border-color);
		--sl-panel-border-width: var(--inlang-panel-border-width);

		/*
   * Tooltips
   */

		--sl-tooltip-border-radius: var(--inlang-tooltip-border-radius);
		--sl-tooltip-background-color: var(--inlang-tooltip-background-color);
		--sl-tooltip-color: var(--inlang-tooltip-color);
		--sl-tooltip-font-family: var(--inlang-tooltip-font-family);
		--sl-tooltip-font-weight: var(--inlang-tooltip-font-weight);
		--sl-tooltip-font-size: var(--inlang-tooltip-font-size);
		--sl-tooltip-line-height: var(--inlang-tooltip-line-height);
		--sl-tooltip-padding: var(--inlang-tooltip-padding);
		--sl-tooltip-arrow-size: var(--inlang-tooltip-arrow-size);

		/*
   * Z-indexes
   */

		--sl-z-index-drawer: var(--inlang-z-index-drawer);
		--sl-z-index-dialog: var(--inlang-z-index-dialog);
		--sl-z-index-dropdown: var(--inlang-z-index-dropdown);
		--sl-z-index-toast: var(--inlang-z-index-toast);
		--sl-z-index-tooltip: var(--inlang-z-index-tooltip);
	}
`
