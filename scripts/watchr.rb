#!/usr/bin/env watchr

# config file for watchr http://github.com/mynyml/watchr
# install: gem install watchr
# run: watch watchr.rb
# note: make sure that you have jstd server running (server.sh) and a browser captured

log_file = File.expand_path(File.dirname(__FILE__) + '/../logs/jstd.log')

`cd ..`
`touch #{log_file}`

puts "String watchr... log file: #{log_file}"
def run(cmd)
  puts(cmd)
  `#{cmd}`
end

watch( '(src/.+\.js|test/unit/.+\.js)' )  do
  # `echo "\n\ntest run started @ \`date\`" > #{log_file}`
  # `script.angularjs/test.sh &> #{log_file}`
  
  # what's called to run my tests
  result = "\ntest run started @ #{Time.now}\n"
  result += run "scripts/test.sh"
  `echo '#{result}' &> #{log_file}`
  
  # then output it
  puts result
end


