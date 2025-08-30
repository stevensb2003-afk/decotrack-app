
'use server';
/**
 * @fileOverview A flow to reset a user's password.
 * 
 * - resetPassword - Generates a new temporary password for a user.
 * - ResetPasswordInput - The input type for the resetPassword function.
 * - ResetPasswordOutput - The return type for the resetPassword function.
 */

import { ai } from '@/ai/genkit';
import { getUserByEmail, updateUserPassword, SystemUser } from '@/services/userService';
import { z } from 'genkit';

export const ResetPasswordInputSchema = z.object({
  email: z.string().email().describe('The email address of the user who forgot their password.'),
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

export const ResetPasswordOutputSchema = z.object({
  success: z.boolean().describe('Whether the password reset was successful.'),
  message: z.string().describe('A message indicating the result.'),
  newPassword: z.string().optional().describe('The new temporary password, if successful.'),
});
export type ResetPasswordOutput = z.infer<typeof ResetPasswordOutputSchema>;

const newPasswordPrompt = ai.definePrompt({
    name: 'newPasswordPrompt',
    prompt: `Generate a secure, random, 8-character password. It must contain at least one uppercase letter, one lowercase letter, one number, and one special character from the set !@#$%^&*`
});

export const resetPasswordFlow = ai.defineFlow(
  {
    name: 'resetPasswordFlow',
    inputSchema: ResetPasswordInputSchema,
    outputSchema: ResetPasswordOutputSchema,
  },
  async (input) => {
    const user: SystemUser | null = await getUserByEmail(input.email);

    if (!user) {
      return {
        success: false,
        message: 'No user found with that email address.',
      };
    }
    
    const { text: newPassword } = await newPasswordPrompt();

    if (!newPassword) {
        return {
            success: false,
            message: 'Could not generate a new password. Please try again.',
        }
    }

    await updateUserPassword(user.id, newPassword);

    return {
      success: true,
      message: 'A new temporary password has been generated.',
      newPassword: newPassword,
    };
  }
);


export async function resetPassword(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
    return resetPasswordFlow(input);
}
