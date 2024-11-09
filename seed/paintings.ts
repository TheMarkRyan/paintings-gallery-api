export type Painting = {
    paintingId: string;
    title: string;
    artist: string;
    year: string;
    description: string;
    medium: string;
    place: string;
    period: string;
    currentStatus: string;
};

export const paintings: Painting[] = [
    {
        paintingId: "1",
        title: "The Grand Odalisque",
        artist: "Jean Auguste Dominique Ingres",
        year: "1814",
        description: "Grand odalisque is an oil painting made by Jean Auguste Ingres in 1814 depicting an Odalisque. It was criticized for its obscene nature and now resides in the Louvre Museum, Paris.",
        medium: "Oil Paint",
        place: "Kingdom Of Naples",
        period: "Neoclassicism",
        currentStatus: "At Louvre Museum"
    },
    {
        paintingId: "2",
        title: "The Liberty leading the people",
        artist: "Eugène Delacroix",
        year: "1830",
        description: "This famous painting portrays the July revolution of 1830, showing a bare-breasted woman leading the people with the French flag, symbolizing Liberty.",
        medium: "Oil Paint",
        place: "Louvre, Paris",
        period: "Romanticism",
        currentStatus: "At Louvre Museum"
    },
    {
        paintingId: "3",
        title: "Napoleon crossing the Alps",
        artist: "Jacques-Louis David",
        year: "1801",
        description: "A royal depiction of Napoleon on his horse, dramatically crossing the Alps with his army. It represents the bold leadership of Napoleon during the Great St. Bernard Pass.",
        medium: "Oil Paint",
        place: "Spain",
        period: "Neoclassicism",
        currentStatus: "At Château de Malmaison"
    },
    {
        paintingId: "4",
        title: "The Sleeping Gypsy",
        artist: "Henri Rousseau",
        year: "1897",
        description: "A fantastical depiction of a gypsy woman sleeping in the moonlight while a lion sniffs her peacefully, showcasing Rousseau's primitivism style.",
        medium: "Oil Paint",
        place: "Paris",
        period: "Primitivism, Modern art, Post-Impressionism, Naïve art",
        currentStatus: "At the Museum of Modern Art, New York"
    },
    {
        paintingId: "5",
        title: "Primavera",
        artist: "Sandro Botticelli",
        year: "1480s",
        description: "A complex mythological portrait of the Goddess Venus at the center, surrounded by other deities symbolizing the arrival of spring.",
        medium: "Tempera",
        place: "Florence",
        period: "Italian Renaissance, Early renaissance",
        currentStatus: "At Uffizi Gallery"
    }
];

