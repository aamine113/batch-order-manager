import { Injectable } from '@nestjs/common';
import password from '@inquirer/password';

// Isolates terminal input behind an injectable so seeder tests can stub it.
@Injectable()
export class PasswordPrompt {
  // Without a terminal the prompt would wait for input that never comes.
  isInteractive(): boolean {
    return process.stdin.isTTY === true;
  }

  ask(message: string): Promise<string> {
    return password({ message, mask: true });
  }
}
