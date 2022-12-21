/**
 * ---------------------------------------------------------------
 * The button is based on Material 3 menus.
 *
 * See https://m3.material.io/components/menus/overview
 * for references on how to use the menus.
 * ---------------------------------------------------------------
 */

import * as menu from "@zag-js/menu";
import { normalizeProps, useMachine } from "@zag-js/solid";
import { Accessor, createMemo, createUniqueId, JSXElement } from "solid-js";
import { createContext, useContext } from "solid-js";
import type { JSX } from "solid-js";

const MenuContext = createContext<Accessor<ReturnType<typeof menu.connect>>>();
const useMenu = () => useContext(MenuContext);

/**
 * A menu.
 *
 * Implementation under the hood: https://zagjs.com/components/solid/menu.
 * Usage guidelines: https://m3.material.io/components/menus/overview
 *
 * @example
 *  <Menu>
 *      <MenuTrigger>
 *          <Button>select dish<Button/>
 *      </MenuTrigger>
 *      <MenuContent>
 *        <MenuItem>🍕 pizza</MenuItem>
 *        <MenuItem>🍔 hamburger</MenuItem>
 *        <MenuItem>🍟 french fries</MenuItem>
 *     </MenuContent>
 *  </Menu>
 */
export function Menu(props: { children: JSXElement }) {
	const [state, send] = useMachine(menu.machine({ id: createUniqueId() }));
	const api = createMemo(() => menu.connect(state, send, normalizeProps));

	return (
		<MenuContext.Provider value={api}>
			<div>{props.children}</div>
		</MenuContext.Provider>
	);
}

/**
 * The trigger that opens and closes the menu.
 *
 * The trigger can be any component. Read more
 * https://zagjs.com/components/solid/menu#anatomy
 *
 * @example
 *  <MenuTrigger>
 *      <Button>select dish<Button/>
 *  </MenuTrigger>
 */
export function MenuTrigger(props: { children?: JSXElement }) {
	const api = useMenu();
	return <div {...api?.().triggerProps}>{props.children}</div>;
}

/**
 * The content of the menu.
 *
 * @param props.children `<MenuItem>` component.
 * @param props.color surface color as defined in https://m3.material.io/components/menus/specs#ad796ca6-3d66-4e7e-9322-c0d93bff5423
 */
export function MenuContent(props: {
	color: "surface-1" | "surface-2" | "surface-3" | "surface-4" | "surface-5";
	children?: JSXElement;
}) {
	const api = useMenu();
	return (
		<div {...api?.().positionerProps}>
			<ul
				{...api?.().contentProps}
				classList={{
					[`bg-${props.color}`]: true,
					["w-32 min-w-fit rounded-md shadow-lg py-1.5 border border-outline"]:
						true,
				}}
			>
				{props.children}
			</ul>
		</div>
	);
}

/**
 * A menu item.
 */
export function MenuItem(
	props: {
		id: string;
		children?: JSXElement;
	} & JSX.HTMLAttributes<HTMLLIElement>
) {
	const api = useMenu();
	return (
		<li
			{...props}
			{...api?.().getItemProps({ id: props.id })}
			classList={{
				"text-on-surface text-sm block py-1 px-3 hover:bg-on-surface/10 cursor-pointer":
					true,
			}}
		>
			{props.children}
		</li>
	);
}
