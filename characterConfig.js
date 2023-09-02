// Define each character's properties here
const characters = {
    "Marvin": {
        "voiceMap": {
            'eng': { languageCode: "en-GB", name: "en-GB-Standard-B", ssmlGender: "MALE" },
            'deu': { languageCode: "de-DE", name: "de-DE-Polyglot-1", ssmlGender: "MALE" },
            //'deu': { languageCode: "de-DE", name: "de-DE-Wavenet-E", ssmlGender: "MALE" },
            //'deu': { languageCode: "de-DE", name: "de-DE-Wavenet-C", ssmlGender: "FEMALE" },
            'bul': { languageCode: "bg-BG", name: "bg-BG-Standard-A", ssmlGender: "FEMALE" },
            'spa': { languageCode: "es-ES", name: "es-ES-Standard-A", ssmlGender: "FEMALE" },
            'rus': { languageCode: "ru-RU", name: "ru-RU-Standard-A", ssmlGender: "FEMALE" },
            'arb': { languageCode: "ar-XA", name: "ar-XA-Standard-A", ssmlGender: "FEMALE" },
            'ben': { languageCode: "bn-IN", name: "bn-IN-Standard-A", ssmlGender: "FEMALE" }, // Assuming Bengali as spoken in India
            'hin': { languageCode: "hi-IN", name: "hi-IN-Standard-A", ssmlGender: "FEMALE" },
            'por': { languageCode: "pt-PT", name: "pt-PT-Standard-A", ssmlGender: "FEMALE" },
            'ind': { languageCode: "id-ID", name: "id-ID-Standard-A", ssmlGender: "FEMALE" },
            'jpn': { languageCode: "ja-JP", name: "ja-JP-Standard-A", ssmlGender: "FEMALE" },
            'fra': { languageCode: "fr-FR", name: "fr-FR-Standard-A", ssmlGender: "FEMALE" },
            'kor': { languageCode: "ko-KR", name: "ko-KR-Standard-A", ssmlGender: "FEMALE" },
            'tur': { languageCode: "tr-TR", name: "tr-TR-Standard-A", ssmlGender: "FEMALE" },
            'urd': { languageCode: "ur-PK", name: "ur-PK-Standard-A", ssmlGender: "FEMALE" }, // Assuming Urdu as spoken in Pakistan
            'pol': { languageCode: "pl-PL", name: "pl-PL-Standard-A", ssmlGender: "FEMALE" },
            'ukr': { languageCode: "uk-UA", name: "uk-UA-Standard-A", ssmlGender: "FEMALE" },
            'tha': { languageCode: "th-TH", name: "th-TH-Standard-A", ssmlGender: "FEMALE" },
            'pes': { languageCode: "fa-IR", name: "fa-IR-Standard-A", ssmlGender: "FEMALE" }, // Assuming Iranian Persian
            'swh': { languageCode: "sw-TZ", name: "sw-TZ-Standard-A", ssmlGender: "FEMALE" }, // Assuming Swahili as spoken in Tanzania
            'ron': { languageCode: "ro-RO", name: "ro-RO-Standard-A", ssmlGender: "FEMALE" },
            'und': { languageCode: "en-US", name: "en-US-Standard-D", ssmlGender: "MALE" }
            // ... add more languages
        },
        "defaultLanguage": "eng",
        "gender": "male",
    },
    "Marta": {
        "voiceMap": {
            'eng': { languageCode: "en-GB", name: "en-GB-Neural2-A", ssmlGender: "FEMALE" },
            'deu': { languageCode: "de-DE", name: "de-DE-Wavenet-C", ssmlGender: "FEMALE" },
            //'deu': { languageCode: "de-DE", name: "de-DE-Wavenet-E", ssmlGender: "MALE" },
            //'deu': { languageCode: "de-DE", name: "de-DE-Wavenet-C", ssmlGender: "FEMALE" },
            'bul': { languageCode: "bg-BG", name: "bg-BG-Standard-A", ssmlGender: "FEMALE" },
            'spa': { languageCode: "es-ES", name: "es-ES-Standard-A", ssmlGender: "FEMALE" },
            'rus': { languageCode: "ru-RU", name: "ru-RU-Standard-A", ssmlGender: "FEMALE" },
            'arb': { languageCode: "ar-XA", name: "ar-XA-Standard-A", ssmlGender: "FEMALE" },
            'ben': { languageCode: "bn-IN", name: "bn-IN-Standard-A", ssmlGender: "FEMALE" }, // Assuming Bengali as spoken in India
            'hin': { languageCode: "hi-IN", name: "hi-IN-Standard-A", ssmlGender: "FEMALE" },
            'por': { languageCode: "pt-PT", name: "pt-PT-Standard-A", ssmlGender: "FEMALE" },
            'ind': { languageCode: "id-ID", name: "id-ID-Standard-A", ssmlGender: "FEMALE" },
            'jpn': { languageCode: "ja-JP", name: "ja-JP-Standard-A", ssmlGender: "FEMALE" },
            'fra': { languageCode: "fr-FR", name: "fr-FR-Standard-A", ssmlGender: "FEMALE" },
            'kor': { languageCode: "ko-KR", name: "ko-KR-Standard-A", ssmlGender: "FEMALE" },
            'tur': { languageCode: "tr-TR", name: "tr-TR-Standard-A", ssmlGender: "FEMALE" },
            'urd': { languageCode: "ur-PK", name: "ur-PK-Standard-A", ssmlGender: "FEMALE" }, // Assuming Urdu as spoken in Pakistan
            'pol': { languageCode: "pl-PL", name: "pl-PL-Standard-A", ssmlGender: "FEMALE" },
            'ukr': { languageCode: "uk-UA", name: "uk-UA-Standard-A", ssmlGender: "FEMALE" },
            'tha': { languageCode: "th-TH", name: "th-TH-Standard-A", ssmlGender: "FEMALE" },
            'pes': { languageCode: "fa-IR", name: "fa-IR-Standard-A", ssmlGender: "FEMALE" }, // Assuming Iranian Persian
            'swh': { languageCode: "sw-TZ", name: "sw-TZ-Standard-A", ssmlGender: "FEMALE" }, // Assuming Swahili as spoken in Tanzania
            'ron': { languageCode: "ro-RO", name: "ro-RO-Standard-A", ssmlGender: "FEMALE" },
            'und': { languageCode: "en-US", name: "en-US-Standard-D", ssmlGender: "MALE" }
            // ... add more languages
        },
        "defaultLanguage": "eng",
        "gender": "female",
    },
    // Add more characters here
};

export default characters;




/* 'eng': { languageCode: "en-GB", name: "en-GB-Standard-B", ssmlGender: "MALE" },
        //'eng': { languageCode: "en-GB", name: "en-GB-Neural2-A", ssmlGender: "FEMALE" },
        'deu': { languageCode: "de-DE", name: "de-DE-Polyglot-1", ssmlGender: "MALE" },
        //'deu': { languageCode: "de-DE", name: "de-DE-Wavenet-E", ssmlGender: "MALE" },
        //'deu': { languageCode: "de-DE", name: "de-DE-Wavenet-C", ssmlGender: "FEMALE" },
        'bul': { languageCode: "bg-BG", name: "bg-BG-Standard-A", ssmlGender: "FEMALE" },
        'spa': { languageCode: "es-ES", name: "es-ES-Standard-A", ssmlGender: "FEMALE" },
        'rus': { languageCode: "ru-RU", name: "ru-RU-Standard-A", ssmlGender: "FEMALE" },
        'arb': { languageCode: "ar-XA", name: "ar-XA-Standard-A", ssmlGender: "FEMALE" },
        'ben': { languageCode: "bn-IN", name: "bn-IN-Standard-A", ssmlGender: "FEMALE" }, // Assuming Bengali as spoken in India
        'hin': { languageCode: "hi-IN", name: "hi-IN-Standard-A", ssmlGender: "FEMALE" },
        'por': { languageCode: "pt-PT", name: "pt-PT-Standard-A", ssmlGender: "FEMALE" },
        'ind': { languageCode: "id-ID", name: "id-ID-Standard-A", ssmlGender: "FEMALE" },
        'jpn': { languageCode: "ja-JP", name: "ja-JP-Standard-A", ssmlGender: "FEMALE" },
        'fra': { languageCode: "fr-FR", name: "fr-FR-Standard-A", ssmlGender: "FEMALE" },
        'kor': { languageCode: "ko-KR", name: "ko-KR-Standard-A", ssmlGender: "FEMALE" },
        'tur': { languageCode: "tr-TR", name: "tr-TR-Standard-A", ssmlGender: "FEMALE" },
        'urd': { languageCode: "ur-PK", name: "ur-PK-Standard-A", ssmlGender: "FEMALE" }, // Assuming Urdu as spoken in Pakistan
        'pol': { languageCode: "pl-PL", name: "pl-PL-Standard-A", ssmlGender: "FEMALE" },
        'ukr': { languageCode: "uk-UA", name: "uk-UA-Standard-A", ssmlGender: "FEMALE" },
        'tha': { languageCode: "th-TH", name: "th-TH-Standard-A", ssmlGender: "FEMALE" },
        'pes': { languageCode: "fa-IR", name: "fa-IR-Standard-A", ssmlGender: "FEMALE" }, // Assuming Iranian Persian
        'swh': { languageCode: "sw-TZ", name: "sw-TZ-Standard-A", ssmlGender: "FEMALE" }, // Assuming Swahili as spoken in Tanzania
        'ron': { languageCode: "ro-RO", name: "ro-RO-Standard-A", ssmlGender: "FEMALE" },
        'und': { languageCode: "en-US", name: "en-US-Standard-D", ssmlGender: "MALE" } */