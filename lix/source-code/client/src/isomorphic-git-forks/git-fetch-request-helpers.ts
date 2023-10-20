function padHex(pad: number, n: number) {
    const s = n.toString(16);
    return '0'.repeat(pad - s.length) + s;
}
export function encodePkLine(line: string) {

    const flushLine = ''; 
    
    if (line === flushLine) {
        // flush lines don't take the padded hex into account length = 0 (ignoring the leading 0000)
        return Buffer.from(padHex(4, 0), 'utf8');
    } else {
        // normal lines are composed of 4 chars for the line lingth + length of the line
        const length = line.length + 4;
        const hexLength = padHex(4, length);
        return Buffer.concat([Buffer.from(hexLength + line, 'utf8')]);
    }

}

export function decodeBuffer(buffers: Buffer[]) {
    const concatenatedBuffer = Buffer.concat(buffers);
    const strings: string[] = [];
    let offset = 0;

    while (offset + 4 < concatenatedBuffer.length) {
        // Extract the hexadecimal length from the buffer
        const hexLength = concatenatedBuffer.subarray(offset, offset + 4).toString('utf8');

        // Parse the hexadecimal length to an integer
        const packLineLength = parseInt(hexLength, 16);

        // Move the offset to the start of the string data
        offset += 4;

        let stringData = ""; // flush
        if (packLineLength !== 0) {
            // not a flush
            // Extract the string data based on the calculated length
            stringData = concatenatedBuffer.subarray(offset, offset + (packLineLength - 4)).toString('utf8');
            offset += (packLineLength - 4);
        }

        // Add the string to the array
        strings.push(stringData);

        // Move the offset to the next potential string
    }

    return strings;
}
