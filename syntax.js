document.getElementById("runBtn").addEventListener("click", runSCL);

function runSCL() {
  const code = document.getElementById("codeInput").value.split("\n");
  let output = "";
  let started = false;
  let skipLine = false;
  let repeatStack = [];
  let repeatCountStack = [];
  let repeatIndexStack = [];
  let inputBuffer = "";
  
  function cleanLine(line) {
    return line.trim();
  }

  function evalMath(expr) {
    try {
      if (!/^[0-9+\-*/ ().]+$/.test(expr)) return null;
      return Function(`"use strict"; return (${expr})`)();
    } catch {
      return null;
    }
  }

  let ifStack = [];

  function getInput(promptText) {
    return prompt(promptText) || "";
  }

  for (let i = 0; i < code.length; i++) {
    let line = cleanLine(code[i]);

    if (!line) continue;

    if (line === "start") {
      started = true;
      continue;
    }
    if (line === "end") {
      started = false;
      continue;
    }
    if (!started) continue;

    if (line.startsWith("repeat = ")) {
      const countStr = line.slice(9).replace(/"/g, "").toLowerCase();
      let count = 0;
      if (countStr === "infinite") {
        alert("Infinite repeat is not supported in playground. Using 10 as fallback.");
        count = 10;
      } else {
        count = parseInt(countStr);
        if (isNaN(count) || count < 1) count = 1;
      }
      repeatStack.push(i);
      repeatCountStack.push(count);
      repeatIndexStack.push(0);
      continue;
    }
    if (line === "end") {
      if (repeatStack.length > 0) {
        let topIndex = repeatStack.length - 1;
        repeatIndexStack[topIndex]++;
        if (repeatIndexStack[topIndex] < repeatCountStack[topIndex]) {
          i = repeatStack[topIndex];
          continue;
        } else {
          repeatStack.pop();
          repeatCountStack.pop();
          repeatIndexStack.pop();
          continue;
        }
      }
    }

    if (line.startsWith("if ")) {
      let condition = line.slice(3);
      if (condition.endsWith(" then")) {
        condition = condition.slice(0, -5);
      }
      let condResult = false;
      try {
        if (/==|!=|>=|<=|>|</.test(condition)) {
          condResult = Function(`return (${condition})`)();
        } else {
          condResult = Boolean(Function(`return (${condition})`)());
        }
      } catch {
        condResult = false;
      }
      ifStack.push(condResult);
      if (!condResult) {
        skipLine = true;
      } else {
        skipLine = false;
      }
      continue;
    }

    if (line === "then") {
      continue;
    }

    if (line === "else") {
      if (ifStack.length === 0) {
        output += "Error: else without if\n";
        continue;
      }
      skipLine = ifStack[ifStack.length - 1];
      ifStack[ifStack.length - 1] = !skipLine;
      continue;
    }

    if (line === "end") {
      if (ifStack.length > 0) {
        ifStack.pop();
        skipLine = false;
        continue;
      }
    }

    if (skipLine) continue;

    if (line.startsWith("say = ")) {
      const match = line.match(/say = "(.*)"/);
      if (match) {
        output += match[1] + "\n";
      } else {
        output += "Error: say syntax\n";
      }
      continue;
    }

    if (line.startsWith("math = ")) {
      const match = line.match(/math = "(.*)"/);
      if (match) {
        const result = evalMath(match[1]);
        if (result === null) {
          output += "Error: math expression\n";
        } else {
          output += result + "\n";
        }
      } else {
        output += "Error: math syntax\n";
      }
      continue;
    }

    if (line.startsWith("wait = ")) {
      continue;
    }

    if (line.startsWith("input = ")) {
      const match = line.match(/input = "(.*)"/);
      if (match) {
        const userInput = getInput(match[1]);
        inputBuffer = userInput;
        output += `Input received: ${userInput}\n`;
      } else {
        output += "Error: input syntax\n";
      }
      continue;
    }

    output += `Unknown or unsupported command: ${line}\n`;
  }

  document.getElementById("output").innerText = output.trim() || "(No output)";
}
