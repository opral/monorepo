import { v4 } from "uuid";
import { afterEach, beforeEach, bench, describe } from "vitest";
import {
	getLeafChange,
	newLixFile,
	openLixInMemory,
	type Change,
} from "../index.js";

const createChange = (parentChangeId?: string) => {
	samplePaylod.resizingConstraint += 1;

	const change: Change = {
		id: v4(),
		parent_id: parentChangeId,
		operation: "create",
		file_id: "mock",
		plugin_key: parentChangeId ? "mock" : "mock1",
		type: "mock",
		// @ts-expect-error - type error in lix
		value: JSON.stringify(samplePaylod),
	};
	return change;
};

const setupLix = async (nChanges: number) => {
	const lix = await openLixInMemory({
		blob: await newLixFile(),
	});

	const mockChanges: Change[] = [];
	let lastChangeId: undefined | string = undefined;
	let firstChangeId: undefined | string = undefined;
	for (let i = 0; i < nChanges; i++) {
		const change = createChange(lastChangeId);
		lastChangeId = change.id;
		if (!firstChangeId) {
			firstChangeId = change.id;
		}
		mockChanges.push(change);
	}

	const batchSize = 256;
	// Insert changes in batches
	for (let i = 0; i < mockChanges.length; i += batchSize) {
		const batch = mockChanges.slice(i, i + batchSize);
		await lix.db.insertInto("change").values(batch).executeTakeFirst();
	}
	// await lix.db.insertInto("change").values(mockChanges).executeTakeFirst();

	return { lix, firstChangeId };
};

async function wait(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, ms); // 1000 milliseconds = 1 second
	});
}

for (let i = 0; i < 5; i++) {
	const nChanges = Math.pow(10, i);
	describe(
		"select changes via property `where value->>resizingConstraint = 100` on " +
			nChanges +
			" changes",
		async () => {
			let project = await setupLix(nChanges);

			bench.skip("payload->property", async () => {
				let result = await project.lix.db
					.selectFrom("change")
					.selectAll()
					.where(
						(eb) => eb.ref("value", "->>").key("resizingConstraint"),
						"=",
						100,
					)

					.executeTakeFirst();

				// console.log(result)
			});

			bench.skip("column", async () => {
				let result = await project.lix.db
					.selectFrom("change")
					.selectAll()
					.where("plugin_key", "=", "mock1")

					.executeTakeFirst();

				// console.log(result)
			});

			bench.skip(
				"getLeafNode",
				async () => {
					await getLeafChange({
						lix: project.lix,
						change: { id: project.firstChangeId } as Change,
					});

					// console.log(result)
				},
				{
					iterations: 2,
				},
			);
		},
	);
}

const samplePaylod = {
	_class: "rectangle",
	do_objectID: "AEB63D36-FA90-4F68-90B0-BFEC297D1AF0",
	booleanOperation: -1,
	isFixedToViewport: false,
	isFlippedHorizontal: false,
	isFlippedVertical: false,
	isLocked: false,
	isTemplate: false,
	isVisible: true,
	layerListExpandedType: 0,
	name: "Screenshot",
	nameIsFixed: true,
	resizingConstraint: 63,
	resizingType: 0,
	rotation: 0,
	shouldBreakMaskChain: false,
	exportOptions: {
		_class: "exportOptions",
		includedLayerIds: [],
		layerOptions: 0,
		shouldTrim: false,
		exportFormats: [],
	},
	frame: {
		_class: "rect",
		constrainProportions: false,
		height: 848,
		width: 1280,
		x: 0,
		y: 79,
	},
	clippingMaskMode: 0,
	hasClippingMask: false,
	style: {
		_class: "style",
		do_objectID: "E52F9334-AB26-4976-95D6-7B07D3B76545",
		endMarkerType: 0,
		miterLimit: 10,
		startMarkerType: 0,
		windingRule: 1,
		blur: {
			_class: "blur",
			isEnabled: false,
			center: "{0.5, 0.5}",
			motionAngle: 0,
			radius: 10,
			saturation: 1,
			type: 0,
		},
		borderOptions: {
			_class: "borderOptions",
			isEnabled: true,
			dashPattern: [],
			lineCapStyle: 0,
			lineJoinStyle: 0,
		},
		borders: [],
		colorControls: {
			_class: "colorControls",
			isEnabled: false,
			brightness: 0,
			contrast: 1,
			hue: 0,
			saturation: 1,
		},
		contextSettings: {
			_class: "graphicsContextSettings",
			blendMode: 0,
			opacity: 1,
		},
		fills: [
			{
				_class: "fill",
				isEnabled: true,
				fillType: 4,
				color: {
					_class: "color",
					alpha: 1,
					blue: 0,
					green: 0,
					red: 1,
				},
				contextSettings: {
					_class: "graphicsContextSettings",
					blendMode: 0,
					opacity: 1,
				},
				gradient: {
					_class: "gradient",
					elipseLength: 0,
					from: "{0.5, 0}",
					gradientType: 0,
					to: "{0.5, 1}",
					stops: [
						{
							_class: "gradientStop",
							position: 0,
							color: {
								_class: "color",
								alpha: 1,
								blue: 1,
								green: 1,
								red: 1,
							},
						},
						{
							_class: "gradientStop",
							position: 1,
							color: {
								_class: "color",
								alpha: 1,
								blue: 0,
								green: 0,
								red: 0,
							},
						},
					],
				},
				image: {
					_class: "MSJSONFileReference",
					_ref_class: "MSImageData",
					_ref: "images/f0e9c250506c97c18d1766a00a7438a22dbbc96b.png",
				},
				noiseIndex: 0,
				noiseIntensity: 0,
				patternFillType: 1,
				patternTileScale: 1,
			},
		],
		innerShadows: [],
		shadows: [],
	},
	edited: false,
	isClosed: true,
	pointRadiusBehaviour: 1,
	points: [
		{
			_class: "curvePoint",
			cornerRadius: 0,
			cornerStyle: 0,
			curveFrom: "{0, 0}",
			curveMode: 1,
			curveTo: "{0, 0}",
			hasCurveFrom: false,
			hasCurveTo: false,
			point: "{0, 0}",
		},
		{
			_class: "curvePoint",
			cornerRadius: 0,
			cornerStyle: 0,
			curveFrom: "{1, 0}",
			curveMode: 1,
			curveTo: "{1, 0}",
			hasCurveFrom: false,
			hasCurveTo: false,
			point: "{1, 0}",
		},
		{
			_class: "curvePoint",
			cornerRadius: 10,
			cornerStyle: 0,
			curveFrom: "{1, 1}",
			curveMode: 1,
			curveTo: "{1, 1}",
			hasCurveFrom: false,
			hasCurveTo: false,
			point: "{1, 1}",
		},
		{
			_class: "curvePoint",
			cornerRadius: 10,
			cornerStyle: 0,
			curveFrom: "{0, 1}",
			curveMode: 1,
			curveTo: "{0, 1}",
			hasCurveFrom: false,
			hasCurveTo: false,
			point: "{0, 1}",
		},
	],
	fixedRadius: 0,
	needsConvertionToNewRoundCorners: false,
	hasConvertedToNewRoundCorners: true,
};
