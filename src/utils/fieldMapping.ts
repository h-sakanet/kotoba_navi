import type { FieldStyleRole, FieldType } from './categoryConfig';

export type DataFieldKey =
    | 'rawWord'
    | 'rawMeaning'
    | 'yomigana'
    | 'exampleSentence'
    | 'exampleSentenceYomigana';

export type EditFormKey =
    | 'word'
    | 'meaning'
    | 'yomigana'
    | 'exampleSentence'
    | 'exampleSentenceYomigana';

const FIELD_TO_DATA_KEY: Record<FieldType, DataFieldKey> = {
    word: 'rawWord',
    meaning: 'rawMeaning',
    yomigana: 'yomigana',
    example: 'exampleSentence',
    example_yomigana: 'exampleSentenceYomigana'
};

const DATA_TO_EDIT_FORM_KEY: Record<DataFieldKey, EditFormKey> = {
    rawWord: 'word',
    rawMeaning: 'meaning',
    yomigana: 'yomigana',
    exampleSentence: 'exampleSentence',
    exampleSentenceYomigana: 'exampleSentenceYomigana'
};

const FIELD_TO_DEFAULT_ROLE: Record<FieldType, FieldStyleRole> = {
    word: 'main',
    meaning: 'sentence',
    yomigana: 'sub',
    example: 'sentence',
    example_yomigana: 'sub'
};

export const getDataFieldKey = (field: FieldType): DataFieldKey => FIELD_TO_DATA_KEY[field];

export const getEditFormKeyFromDataField = (key: DataFieldKey): EditFormKey => DATA_TO_EDIT_FORM_KEY[key];

export const getDefaultRoleForField = (field: FieldType): FieldStyleRole => FIELD_TO_DEFAULT_ROLE[field];
