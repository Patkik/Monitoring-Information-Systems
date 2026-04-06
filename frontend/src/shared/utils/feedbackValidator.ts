export type RatingValidationResult = { valid: true } | { valid: false; error: string };

export const validateRating = (value: any): RatingValidationResult => {
    const parsedValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsedValue) || parsedValue < 1 || parsedValue > 5) {
        return { valid: false, error: 'Rating must be between 1 and 5' };
    }

    return { valid: true };
};
