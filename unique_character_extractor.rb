#!/usr/bin/env ruby

require 'json'

input_file = ARGV.shift

unique_chars = {}
groups = []
group = {}

File.readlines(input_file).map(&:chomp).each do |line|
  if line =~ /^#\s*(.+)$/
    group = {
        'name' => $1,
        'value' => ''
    }
    groups << group
  else
    chars = line.split('')
    chars.each do |char|
      unless unique_chars.has_key?(char)
        group['value'] << char
        unique_chars[char] = 1
      end
    end
  end
end

groups.each do |group|
  group['name'] = "#{group['name']} (#{group['value'].length} characters)"
end

File.open("./#{input_file}.out", 'w') do |file|
  file.write(JSON.pretty_generate(groups))
end
