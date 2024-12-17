import { Model } from 'mongoose';

/**
 * Fake data for tests purpose */
export const createModelMock = <T>(): Model<T> => {
    return {
        countDocuments: jest.fn(),
        insertMany: jest.fn(),
        create: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        deleteOne: jest.fn(),
        update: jest.fn(),
        updateOne: jest.fn(),
        replaceOne: jest.fn(),
        exists: jest.fn(),
    } as unknown as Model<T>;
};
