const defaultPresets = {
  textReplacements: {
    id: "sys_2vgcKChtuB3QKkbZbrHr2fEkeHE",
    type: "modelBanks",
    meta: {
      state: 'oh.Active',
      createdAt: new Date(2025, 3, 13, 0, 0, 0),
      updatedAt: new Date(2025, 3, 13, 0, 0, 0)
    },
    attributes: {
      name: "Default Text Replacements",
      models: [{
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_gpt4omini",
        name: "OpenAI GPT-4o mini",
        id: "openai/gpt-4o-mini-2024-07-18",
        temperature: .7,
        group: "Popular"
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_gpt4o",
        name: "OpenAI GPT-4o",
        id: "openai/gpt-4o-2024-05-13",
        temperature: .7,
        group: "Popular"
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_ac3opus",
        name: "Claude 3 - Opus",
        id: "anthropic/claude-3-opus:beta",
        temperature: .7,
        maxTokens: 4096,
        group: "Anthropic"
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_ac37sonnet",
        name: "Claude 3.7 - Sonnet",
        id: "anthropic/claude-3.7-sonnet:beta",
        temperature: .7,
        maxTokens: 8192,
        group: "Popular"
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_ac35sonnet",
        name: "Claude 3.5 - Sonnet",
        id: "anthropic/claude-3.5-sonnet:beta",
        temperature: .7,
        maxTokens: 8e3,
        group: "Popular"
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_ac3sonnet",
        name: "Claude 3 - Sonnet",
        id: "anthropic/claude-3-sonnet:beta",
        temperature: .7,
        maxTokens: 4096,
        group: "Anthropic"
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_ac3haiku",
        name: "Claude 3 - Haiku",
        id: "anthropic/claude-3-haiku:beta",
        temperature: .7,
        maxTokens: 4096,
        group: "Popular"
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_mistralLarge",
        name: "Mistral Large",
        id: "mistralai/mistral-large",
        temperature: .7,
        maxTokens: 4096,
        group: "Popular",
        orRouting: ["Mistral"]
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_mistralMedium",
        name: "Mistral Medium",
        id: "mistralai/mistral-medium-3",
        temperature: .7,
        maxTokens: 4096,
        orRouting: ["Mistral"]
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_google_gemini_1_5_flash",
        name: "Gemini 1.5 Flash",
        id: "google/gemini-flash-1.5",
        temperature: .7,
        group: "Popular"
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_google_gemini_1_5_pro",
        name: "Gemini 1.5 Pro",
        id: "google/gemini-pro-1.5",
        temperature: .7,
        group: "Google"
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_google_gemma_2_9b",
        name: "Gemma 2 9B",
        id: "google/gemma-2-9b-it:free",
        temperature: .7,
        group: "Google"
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_toppy",
        name: "Toppy M 7B",
        id: "undi95/toppy-m-7b",
        temperature: .7,
        group: "Popular"
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_llama3_70b",
        name: "Llama 3 70b",
        id: "meta-llama/llama-3-70b-instruct",
        temperature: .7
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_coherecmdrplus",
        name: "Cohere Command-R+",
        id: "cohere/command-r-plus-04-2024",
        temperature: .7,
        group: "Popular"
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_wizard2_8x22",
        name: "Wizardlm 2 8x22b",
        id: "microsoft/wizardlm-2-8x22b",
        temperature: .7,
        group: "NSFW"
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_l31_euryale_70b",
        name: "Llama 3.1 Euryale 70b",
        id: "sao10k/l3.1-euryale-70b",
        group: "NSFW",
        temperature: 1.1,
        topP: .96,
        frequencyPenalty: .4,
        presencePenalty: .8,
        minP: .1,
        repetitionPenalty: 1
      }, {
        internalId: "sys_2VzfA7iFhD6xlqxPAI1FZEVEyBr_hermes",
        name: "Nous: Hermes Llama2 13B",
        id: "nousresearch/nous-hermes-llama2-13b",
        temperature: .7,
        group: "NSFW"
      }]
    },
    relationships: {
      owner: {
        type: "users",
        id: "system"
      }
    }
  },
  chats: {
    id: "sys_2vgcKGyhrSc22NnFa0Z1iF2oS2z",
    type: "modelBanks",
    meta: {
      state: 'oh.Active',
      createdAt: new Date(2025, 3, 13, 0, 0, 0),
      updatedAt: new Date(2025, 3, 13, 0, 0, 0)
    },
    attributes: {
      name: "Default Chat Models",
      models: [{
        internalId: "2k1swil5LhcWeqHT6FGP1N4dozn",
        name: "OpenAI GPT-4o mini",
        id: "openai/gpt-4o-mini-2024-07-18",
        group: "Popular"
      }, {
        internalId: "2gQfzz0It4Bk3lpkloBHsrC8U2O",
        name: "GPT-4o",
        id: "openai/gpt-4o-2024-05-13",
        group: "Popular"
      }, {
        internalId: "2uAQ5OR0L930nbSYVNR9YffvmN7",
        name: "Claude 3.7 - Sonnet",
        id: "anthropic/claude-3.7-sonnet:beta",
        maxTokens: 8192,
        temperature: 1,
        topP: .9,
        group: "Popular"
      }, {
        internalId: "2i9e0oJhtwqIIEoAwPmqaREkcLq",
        name: "Claude 3.5 - Sonnet",
        id: "anthropic/claude-3.5-sonnet:beta",
        maxTokens: 4e3,
        temperature: 1,
        topP: .9,
        group: "Popular"
      }, {
        internalId: "2dFHZONebFjbxeWsp4axXyRUPZj",
        name: "Claude 3 - Opus",
        id: "anthropic/claude-3-opus:beta",
        maxTokens: 4e3,
        temperature: 1,
        topP: .9,
        group: "Anthropic"
      }, {
        internalId: "2dFHZhAu1EoeN5V2Csmk62alr4J",
        name: "Claude 3 - Sonnet",
        id: "anthropic/claude-3-sonnet:beta",
        maxTokens: 4e3,
        temperature: 1,
        topP: .9,
        group: "Anthropic"
      }, {
        internalId: "2deP7kzhftT8WHtz9Zf6RWkJPWJ",
        name: "Claude 3 - Haiku",
        id: "anthropic/claude-3-haiku:beta",
        maxTokens: 4e3,
        temperature: 1,
        topP: .9,
        group: "Anthropic"
      }, {
        internalId: "2gTbAdrwIKrV8hrLDaWfWtNpyJ4",
        name: "Cohere Command-R+",
        id: "cohere/command-r-plus-04-2024",
        temperature: 1,
        topK: 40,
        group: "Popular"
      }, {
        internalId: "2nRXCQNCzVoI7ectX612CORKlDB",
        id: "google/gemma-2-9b-it:free",
        name: "Gemma 2 9B",
        group: "Popular"
      }, {
        internalId: "2dFBC2MkBrDDSR9vVpuxldcPEFX",
        name: "Mistral Large",
        id: "mistralai/mistral-large",
        temperature: .9,
        topP: .9,
        group: "Popular",
        orRouting: ["Mistral"]
      }, {
        internalId: "2b9098cGCrAWRHRqeimdCjUy66j",
        name: "Mistral Medium",
        id: "mistralai/mistral-medium-3",
        temperature: .6,
        topP: .6,
        orRouting: ["Mistral"]
      }, {
        internalId: "2YE7Sj5FcWTjmYIDq3dwzSHog9U",
        name: "Toppy M 7B",
        id: "undi95/toppy-m-7b",
        temperature: .3,
        topP: .8,
        frequencyPenalty: .5,
        group: "Popular"
      }, {
        internalId: "2nRXaT4xiYcvShinovw05i5RQ2P",
        name: "Gemini 1.5 Pro",
        id: "google/gemini-pro-1.5",
        group: "Popular"
      }, {
        internalId: "2gTeWnuR2VUtpSof0lQG8R7DuHD",
        name: "Gemini 1.5 Flash",
        id: "google/gemini-flash-1.5",
        group: "Popular"
      }, {
        internalId: "2msrT6SA7LL7qINfeITrFywuKSt",
        name: "Llama 3.1 Euryale 70b",
        id: "sao10k/l3.1-euryale-70b",
        group: "NSFW",
        temperature: 1.1,
        topP: .96,
        frequencyPenalty: .4,
        presencePenalty: .8,
        minP: .1,
        repetitionPenalty: 1
      }, {
        internalId: "2YE7R3b3Bn38VlEjDhYIbhosUsj",
        name: "Goliath 120B (beta)",
        id: "alpindale/goliath-120b",
        group: "NSFW",
        temperature: .7,
        topP: .8,
        frequencyPenalty: .5,
        maxTokens: 500
      }]
    },
    relationships: {
      owner: {
        type: "users",
        id: "system"
      }
    }
  },
  summarization: {
    id: "sys_2vgcKDtNnOPzzakWbexwpzeNlac",
    type: "modelBanks",
    meta: {
      state: 'oh.Active',
      createdAt: new Date(2025, 3, 13, 0, 0, 0),
      updatedAt: new Date(2025, 3, 13, 0, 0, 0)
    },
    attributes: {
      name: "Default Summarization",
      models: [{
        internalId: "2jSgava5MlzNCyeAUfW2JPQjglN",
        name: "OpenAI GPT-4o mini",
        id: "openai/gpt-4o-mini-2024-07-18",
        group: "Recommended"
      }, {
        internalId: "2gQg025EaIA69Rlx6djs9AqnKpQ",
        name: "OpenAI GPT-4o",
        id: "openai/gpt-4o-2024-05-13"
      }, {
        internalId: "2i9dsz5PMk1tNj7VE0dtIRssPNM",
        id: "anthropic/claude-3.5-sonnet:beta",
        name: "Claude 3.5 - Sonnet",
        temperature: .3
      }, {
        internalId: "2uAR7aao1mAxeVg8EhDXHvyjAAx",
        id: "anthropic/claude-3.7-sonnet:beta",
        name: "Claude 3.7 - Sonnet",
        temperature: .3
      }, {
        internalId: "2dFFSU88HBOcBiOdcZN4fxRV3iE",
        id: "anthropic/claude-3-haiku:beta",
        name: "Claude 3 - Haiku",
        temperature: .3,
        group: "Recommended"
      }, {
        internalId: "2gTJq03i9AVsYEZLV1nbO6qMzgB",
        id: "google/gemini-flash-1.5",
        name: "Gemini 1.5 Flash",
        group: "Recommended"
      }, {
        internalId: "2msls1i7ABdlAPOvlRAVuekbBHH",
        id: "google/gemma-2-9b-it:free",
        name: "Gemma 2 9B"
      }, {
        internalId: "2jSjV10uvngTkN3RNhYmoZT9eMv",
        id: "microsoft/phi-3-medium-128k-instruct",
        name: "Phi-3 Medium 128K"
      }, {
        internalId: "2YpNRbTo1AJ0pCmeusi7SjKjUNC",
        id: "undi95/toppy-m-7b",
        name: "Toppy M 7B"
      }, {
        internalId: "2dFH2hbKLx5IC4Yq183Hkrmnj9T",
        name: "Mistral Large",
        id: "mistralai/mistral-large",
        orRouting: ["Mistral"]
      }, {
        internalId: "2dFH33H1lKMwKL2bEbpRYYpLV2j",
        name: "Mistral Medium",
        id: "mistralai/mistral-medium-3",
        orRouting: ["Mistral"]
      }]
    },
    relationships: {
      owner: {
        type: "users",
        id: "system"
      }
    }
  },
  storyBeats: {
    id: "sys_2vgcKIMUOWmn1LN5Ai8wXYA63ms",
    type: "modelBanks",
    meta: {
      state: 'oh.Active',
      createdAt: new Date(2025, 3, 13, 0, 0, 0),
      updatedAt: new Date(2025, 3, 13, 0, 0, 0)
    },
    attributes: {
      name: "Default Writing Models",
      models: [{
        internalId: "2jSgn2ibqVOoY3Zcm2XROXmRRXo",
        name: "OpenAI GPT-4o mini",
        id: "openai/gpt-4o-mini-2024-07-18",
        temperature: 1.1,
        topP: .8,
        presencePenalty: .15,
        frequencyPenalty: .35,
        group: "Popular"
      }, {
        internalId: "2gQg02wiFXZVEIL9rUktKxqJsnA",
        name: "OpenAI GPT-4o",
        id: "openai/gpt-4o-2024-05-13",
        temperature: 1.1,
        topP: .8,
        frequencyPenalty: .25,
        group: "Popular"
      }, {
        internalId: "2uAQ1JsnWXeHVYHsAwSAGBid40K",
        name: "Claude 3.7 - Sonnet",
        id: "anthropic/claude-3.7-sonnet:beta",
        maxTokens: 8192,
        temperature: 1,
        topP: .9,
        group: "Popular"
      }, {
        internalId: "2i9dxQkqdGUCcUvYgB67qZ23Bgh",
        name: "Claude 3.5 - Sonnet",
        id: "anthropic/claude-3.5-sonnet:beta",
        maxTokens: 4e3,
        temperature: 1,
        topP: .9,
        group: "Popular"
      }, {
        internalId: "2dFDESzc3mXN4UyydNNF6ZnS3MW",
        name: "Claude 3 - Opus",
        id: "anthropic/claude-3-opus:beta",
        maxTokens: 4e3,
        temperature: 1,
        topP: .9,
        group: "Popular"
      }, {
        internalId: "2dFDEy3KcMmH5Ykn2FUODdwXo36",
        name: "Claude 3 - Sonnet",
        id: "anthropic/claude-3-sonnet:beta",
        maxTokens: 4e3,
        temperature: 1,
        topP: .9,
        group: "Anthropic"
      }, {
        internalId: "2dpvhgmi8Y9LDkA4EaAMvgxln2U",
        name: "Claude 3 - Haiku",
        id: "anthropic/claude-3-haiku:beta",
        maxTokens: 4e3,
        temperature: 1,
        topP: .9,
        group: "Popular"
      }, {
        internalId: "2msmEGYRYBEwSF5ZEbJhxaBqzxg",
        id: "google/gemma-2-9b-it:free",
        name: "Gemma 2 9B",
        group: "Popular"
      }, {
        internalId: "2YE85BiCJYYsMd9geGTZiUygRYs",
        name: "Toppy M 7B",
        id: "undi95/toppy-m-7b",
        temperature: .7,
        topP: .7,
        frequencyPenalty: .5,
        maxTokens: 2048,
        group: "Popular"
      }, {
        internalId: "2gTJpxhoPwWGevWVWA6vrTXnBuh",
        name: "Gemini 1.5 Pro",
        id: "google/gemini-pro-1.5",
        maxTokens: 5e4,
        temperature: 1,
        topP: .9,
        frequencyPenalty: .2,
        group: "Google"
      }, {
        internalId: "2gTfyL08jeAIM2Hcs7ISjAnKUUV",
        name: "Gemini 1.5 Flash",
        id: "google/gemini-flash-1.5",
        maxTokens: 5e4,
        temperature: 1,
        topP: .9,
        frequencyPenalty: .2,
        group: "Google"
      }, {
        internalId: "2dFERKRj7c3A37e2yXHUO9jMq6Z",
        name: "Mistral Large",
        id: "mistralai/mistral-large",
        temperature: .9,
        topP: .9,
        orRouting: ["Mistral"]
      }, {
        internalId: "2gTgHt74IcJyiFd37Y6tkvCSeFc",
        name: "Llama 3 70b",
        id: "meta-llama/llama-3-70b-instruct"
      }, {
        internalId: "2gTgHtlw5vfBpFHeNfMXZxhjNOs",
        name: "Cohere Command-R+",
        id: "cohere/command-r-plus-04-2024",
        group: "Popular"
      }, {
        internalId: "2gTgdTfGr0LmrECVYeezcXdHoK1",
        name: "Wizardlm 2 8x22b",
        id: "microsoft/wizardlm-2-8x22b",
        group: "NSFW"
      }, {
        internalId: "2msr6FB848P501t40d6bepN1q0U",
        name: "Llama 3.1 Euryale 70b",
        id: "sao10k/l3.1-euryale-70b",
        group: "NSFW",
        temperature: 1.1,
        topP: .96,
        frequencyPenalty: .4,
        presencePenalty: .8,
        minP: .1,
        repetitionPenalty: 1
      }, {
        internalId: "2YE7InvccPAv5XLOI7VC6DWMDa4",
        name: "Goliath 120B (beta)",
        id: "alpindale/goliath-120b",
        temperature: .7,
        topP: .8,
        frequencyPenalty: .5,
        maxTokens: 500,
        group: "NSFW"
      }, {
        internalId: "2b90PACN5aEdPWRPxqMqMXlbMmG",
        name: "Mistral Medium",
        id: "mistralai/mistral-medium-3",
        temperature: .6,
        topP: .6,
        orRouting: ["Mistral"]
      }]
    },
    relationships: {
      owner: {
        type: "users",
        id: "system"
      }
    }
  }
}

export default defaultPresets;