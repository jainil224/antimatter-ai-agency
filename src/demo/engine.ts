import type { Step, AlgorithmVariant, SupportedLanguage } from '@shared/types/Algorithm';

// --- BRUTE FORCE ---

const bruteForceCode: Record<SupportedLanguage, string> = {
    java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[]{i, j};
                }
            }
        }
        return new int[]{};
    }
}`,
    python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]
        return []`,
    cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        for (int i = 0; i < nums.size(); i++) {
            for (int j = i + 1; j < nums.size(); j++) {
                if (nums[i] + nums[j] == target) {
                    return {i, j};
                }
            }
        }
        return {};
    }
};`,
    c: `int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[i] + nums[j] == target) {
                int* result = malloc(2 * sizeof(int));
                result[0] = i; result[1] = j;
                *returnSize = 2;
                return result;
            }
        }
    }
    *returnSize = 0;
    return NULL;
}`
};

const runBruteForce = (nums: number[], target: number): Step[] => {
    const steps: Step[] = []
    for (let i = 0; i < nums.length; i++) {
        steps.push({
            type: 'POINTER',
            indices: [i],
            message: `We select the first number: ${nums[i]} (at index ${i}). We will now look for another number that adds up to ${target}.`,
            codeLineMap: {
                java: [5, 5], python: [5, 5], cpp: [6, 6], c: [4, 4]
            }
        })
        for (let j = i + 1; j < nums.length; j++) {
            steps.push({
                type: 'POINTER',
                indices: [i, j],
                message: `We check the next number: ${nums[j]} (at index ${j}).`,
                codeLineMap: {
                    java: [4, 4], python: [4, 4], cpp: [5, 5], c: [3, 3]
                }
            })

            const sum = nums[i] + nums[j]
            const isMatch = sum === target;

            steps.push({
                type: 'COMPARE',
                indices: [i, j],
                value: sum,
                message: `Does ${nums[i]} + ${nums[j]} equal ${target}? \nCurrent Sum: ${sum}. ${isMatch ? 'Yes!' : 'No.'}`,
                codeLineMap: {
                    java: [3, 3], python: [3, 3], cpp: [3, 3], c: [3, 3]
                }
            })

            if (isMatch) {
                steps.push({
                    type: 'FOUND',
                    indices: [i, j],
                    message: `✅ Match found because ${nums[i]} + ${nums[j]} equals the target (${target}). \nReturning indices [${i}, ${j}].`,
                    codeLineMap: {
                        java: [6, 6], python: [6, 6], cpp: [7, 7], c: [5, 8]
                    }
                })
                return steps
            }
        }
    }
    steps.push({
        type: 'RETURN',
        message: 'We have checked all pairs and found no solution.',
        codeLineMap: {
            java: [8, 8], python: [5, 5], cpp: [8, 8], c: [11, 12]
        }
    })
    return steps
}

// --- HASH MAP ---

const hashMapCode: Record<SupportedLanguage, string> = {
    java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
    python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        map_val = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in map_val:
                return [map_val[complement], i]
            map_val[num] = i
        return []`,
    cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.count(complement)) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};`,
    c: `int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    HashMap* map = createHashMap();
    for (int i = 0; i < numsSize; i++) {
        int complement = target - nums[i];
        if (containsKey(map, complement)) {
            int* result = malloc(2 * sizeof(int));
            result[0] = get(map, complement); result[1] = i;
            *returnSize = 2;
            return result;
        }
        put(map, nums[i], i);
    }
    *returnSize = 0;
    return NULL;
}`
};

const runHashMap = (nums: number[], target: number): Step[] => {
    const steps: Step[] = []
    const map = new Map<number, number>()

    for (let i = 0; i < nums.length; i++) {
        const val = nums[i]
        const complement = target - val

        steps.push({
            type: 'POINTER',
            indices: [i],
            message: `Visit number ${val} at index ${i}. We need ${complement} (${target} - ${val}) to match.`,
            codeLineMap: {
                java: [7, 7], python: [7, 7], cpp: [8, 8], c: [6, 9]
            }
        })

        // Check map
        steps.push({
            type: 'COMPARE',
            indices: [i],
            message: `Check Map used numbers for ${complement}...`,
            codeLineMap: {
                java: [6, 6], python: [6, 6], cpp: [7, 7], c: [5, 5]
            }
        })

        if (map.has(complement)) {
            const complementIndex = map.get(complement)!
            steps.push({
                type: 'FOUND',
                indices: [complementIndex, i], // Highlight both
                message: `Found match! ${complement} was seen at index ${complementIndex}. Return [${complementIndex}, ${i}].`,
                codeLineMap: {
                    java: [5, 5], python: [5, 5], cpp: [5, 5], c: [6, 9]
                }
            })
            return steps
        }

        // Put in map
        map.set(val, i)
        steps.push({
            type: 'POINTER',
            indices: [i],
            message: `${complement} not in map. Store ${val} (index ${i}) for future checks.`,
            codeLineMap: {
                java: [9, 9], python: [9, 9], cpp: [10, 10], c: [11, 11]
            }
        })
    }

    steps.push({
        type: 'RETURN',
        message: 'Traversed all numbers. No solution found.',
        codeLineMap: {
            java: [9, 9], python: [7, 7], cpp: [9, 9], c: [13, 14]
        }
    })
    return steps
}

export const variants: Record<string, AlgorithmVariant> = {
    bruteForce: { id: 'bruteForce', label: 'Brute Force (O(n²))', code: bruteForceCode, run: runBruteForce },
    hashMap: { id: 'hashMap', label: 'Hash Map (O(n))', code: hashMapCode, run: runHashMap }
}
