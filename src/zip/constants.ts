export { CRC32_TABLE, crc32 } from "./crc32";

export const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
export const CENTRAL_DIR_HEADER_SIGNATURE = 0x02014b50;
export const END_OF_CENTRAL_DIR_SIGNATURE = 0x06054b50;

export const ZIP_VERSION = 20;
export const NO_COMPRESSION = 0;
export const DEFLATE_COMPRESSION = 8;

export const LOCAL_HEADER_SIZE = 30;
export const CENTRAL_HEADER_SIZE = 46;
export const END_OF_CENTRAL_DIR_SIZE = 22;
