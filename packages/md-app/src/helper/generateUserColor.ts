const availableColors = [
	"red",
	"orange",
	"amber",
	"yellow",
	"lime",
	"green",
	"emerald",
	"teal",
	"cyan",
	"sky",
	"blue",
	"indigo",
	"violet",
	"purple",
	"pink",
	"rose",
];

//generate random color name from userName
export const generateColor = (userName: string) => {
	const userNameHash = userName
		.split("")
		.reduce((acc, char) => acc + char.charCodeAt(0), 0);
	const colorIndex = userNameHash % availableColors.length;
	const color = availableColors[colorIndex];
	return color;
};
