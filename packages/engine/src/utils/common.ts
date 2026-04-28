import { sortBy } from "lodash";

export const rankBy = <T>(items: T[], key: keyof T | ((item: T) => unknown), limit: number = 5): T[] => {
    return sortBy(items, key).reverse().slice(0, limit);
};