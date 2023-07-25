/*
 * Demultiplex a "multiplexed" packfile as sent via wire protocol v2. 
 *
 * Assumes only a single sideband channel has beend used, as with the
 * `no-progress` option to upload-pack.
 */
export default function demuxPackfile(packData: Uint8Array) {
	let offset = 0
	let pktLength = 0
	let pktsProcessed = 0
	
	const decoder = new TextDecoder()

	// For each packet, shift the contents backwards, clobbering the length and
	// sideband information
	while (pktLength = parseInt(decoder.decode(packData.subarray(offset, offset += 5)), 16))
		packData.copyWithin(offset - 5 * ++pktsProcessed, offset, offset += pktLength - 5)

	// We shifted the contents backwards, so cut off the end since it contains
	// garbage data
	return packData.subarray(0, packData.length - (++pktsProcessed * 5) + 1)
}
